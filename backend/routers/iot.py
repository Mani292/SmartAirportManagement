from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import db_log_telemetry, db_get_telemetry
from services.anomaly_detection import detect_anomaly
from routers.incidents import create_incident, IncidentCreate

router = APIRouter()

class TelemetryData(BaseModel):
    asset_id: str
    temperature: float
    vibration: float
    humidity: Optional[float] = 40.0

@router.post("/sensor-data")
def receive_sensor_data(data: TelemetryData):
    """
    Ingest IoT sensor data, log it, and trigger AI anomaly detection.
    If an anomaly is found, it automatically creates a high-priority incident.
    """
    anomaly = detect_anomaly(data.temperature, data.vibration)
    status = "NORMAL" if not anomaly else "ANOMALY"
    
    # Log to fallback DB
    db_log_telemetry(data.asset_id, data.temperature, data.vibration, data.humidity, status)
    
    if anomaly:
        # Auto-create incident via AI Triage logic
        incident = IncidentCreate(
            short_description=f"IoT Alert: {anomaly} detected on asset {data.asset_id}",
            location="Airport Terminal",
            area="Technical Room",
            department="Facilities",
            reported_via="IoT_Sensor"
        )
        create_incident(incident)
        return {"status": "anomaly_detected", "type": anomaly, "action": "incident_created"}
    
    return {"status": "received", "anomaly": False}

@router.get("/history/{asset_id}")
def get_sensor_history(asset_id: str):
    return db_get_telemetry(asset_id)
