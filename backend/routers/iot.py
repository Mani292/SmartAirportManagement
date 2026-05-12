"""
iot.py — IoT telemetry ingestion router for Smart Airport Management.

Responsibilities:
  - Ingest real-time sensor readings from airport IoT devices.
  - Run statistical anomaly detection (Z-score + threshold).
  - Auto-create ServiceNow incidents when anomalies are detected.
  - Log all telemetry and anomaly events to the audit trail.
  - Expose sensor history for trend analysis and Digital Twin rendering.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from database import db_log_telemetry, db_get_telemetry
from services.anomaly_detection import detect_anomaly
from routers.incidents import create_incident, IncidentCreate
from routers.auth import get_current_user
from logger.audit import log_audit

router = APIRouter()


# ── Pydantic Models ────────────────────────────────────────────────────────────

class TelemetryData(BaseModel):
    """Incoming IoT sensor payload from a single airport asset."""
    asset_id: str = Field(..., min_length=1, max_length=100, description="Unique asset identifier (e.g. HVAC-12, BAGGAGE-04)")
    airport_id: str = Field(default="SJC-01", description="Multi-tenant airport identifier")
    temperature: float = Field(..., ge=-40.0, le=200.0, description="Temperature reading in °C")
    vibration: float = Field(..., ge=0.0, le=500.0, description="Vibration reading in Hz")
    humidity: Optional[float] = Field(default=40.0, ge=0.0, le=100.0, description="Relative humidity %")
    asset_type: Optional[str] = Field(default="default", description="Asset category for context-aware thresholds")


class TelemetryResponse(BaseModel):
    """Response from the telemetry ingestion endpoint."""
    status: str
    asset_id: str
    anomaly_detected: bool
    anomaly_type: Optional[str] = None
    anomaly_severity: Optional[str] = None
    anomaly_message: Optional[str] = None
    action: Optional[str] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/telemetry", response_model=TelemetryResponse, status_code=status.HTTP_200_OK)
async def receive_telemetry(data: TelemetryData):
    """
    **POST /iot/telemetry**

    Ingests real-time IoT sensor data from an airport asset, runs statistical
    anomaly detection, and automatically raises a P1 ServiceNow incident if
    an anomaly is detected.

    - Uses Z-score analysis if ≥5 historical readings exist for the asset.
    - Falls back to dynamic thresholds for cold-start situations.
    - Returns a structured AnomalyResult for transparent AI decision tracing.
    """
    # 1. Fetch recent history for statistical baseline
    history = db_get_telemetry(data.asset_id, limit=20)

    # 2. Run anomaly detection
    anomaly = detect_anomaly(
        temperature=data.temperature,
        vibration=data.vibration,
        history=history,
        asset_type=data.asset_type or "default",
        humidity=data.humidity,
    )

    telemetry_status = "ANOMALY" if anomaly else "NORMAL"

    # 3. Persist telemetry to fallback DB
    db_log_telemetry(
        data.asset_id, data.temperature, data.vibration,
        data.humidity or 40.0, telemetry_status
    )

    # 4. Handle detected anomaly
    if anomaly:
        # Auto-create a priority incident via the AI Triage engine
        incident_description = (
            f"[IoT] {anomaly['anomaly_type']} on asset {data.asset_id} "
            f"| Severity: {anomaly['severity']} "
            f"| {anomaly['message']}"
        )
        if anomaly.get("z_score") is not None:
            incident_description += f" | Z-Score: {anomaly['z_score']}"

        incident = IncidentCreate(
            short_description=incident_description,
            location=f"Airport {data.airport_id}",
            area="Technical Room",
            department="Facilities",
            reported_via="IoT_Sensor",
        )
        await create_incident(incident)

        log_audit(
            "SYSTEM",
            "IOT_ANOMALY_DETECTED",
            f"Asset={data.asset_id} | Airport={data.airport_id} | "
            f"Type={anomaly['anomaly_type']} | Severity={anomaly['severity']}",
        )

        return TelemetryResponse(
            status="anomaly_detected",
            asset_id=data.asset_id,
            anomaly_detected=True,
            anomaly_type=anomaly["anomaly_type"],
            anomaly_severity=anomaly["severity"],
            anomaly_message=anomaly["message"],
            action="incident_auto_created",
        )

    return TelemetryResponse(
        status="normal",
        asset_id=data.asset_id,
        anomaly_detected=False,
    )


@router.get("/history/{asset_id}")
async def get_sensor_history(asset_id: str, limit: int = 20, user: dict = Depends(get_current_user)):
    """
    **GET /iot/history/{asset_id}**

    Returns the most recent telemetry readings for a given asset.
    Used by the Digital Twin dashboard and predictive maintenance engine.
    """
    if not asset_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="asset_id must not be empty")
    return {"asset_id": asset_id, "history": db_get_telemetry(asset_id, limit=limit)}
