from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List, Dict
from database import db_log_telemetry, db_get_telemetry
from services.anomaly_detection import detect_anomaly
from routers.incidents import create_incident, IncidentCreate
import json

router = APIRouter()

# ── WebSocket Manager for Real-Time Telemetry ─────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Handle broken connections
                pass

manager = ConnectionManager()

# ── Models ────────────────────────────────────────────────────────────────────
class TelemetryData(BaseModel):
    asset_id: str
    temperature: float
    vibration: float
    humidity: Optional[float] = 40.0

# ── Routes ────────────────────────────────────────────────────────────────────

@router.websocket("/ws")
async def telemetry_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time telemetry updates.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.post("/sensor-data")
async def receive_sensor_data(data: TelemetryData):
    """
    Ingest IoT sensor data, log it, and trigger enhanced AI anomaly detection.
    If an anomaly is found, it automatically creates a high-priority incident.
    Broadcasts the update via WebSocket for real-time visibility.
    """
    # Fetch historical telemetry for statistical analysis
    history = db_get_telemetry(data.asset_id, limit=20)

    # AI Anomaly Detection with History
    anomaly = detect_anomaly(data.temperature, data.vibration, history)
    status = "NORMAL" if not anomaly else "ANOMALY"
    
    # Log to fallback DB
    db_log_telemetry(data.asset_id, data.temperature, data.vibration, data.humidity, status)
    
    # Real-time Broadcast
    payload = {
        "event": "TELEMETRY_UPDATE",
        "asset_id": data.asset_id,
        "temperature": data.temperature,
        "vibration": data.vibration,
        "status": status,
        "anomaly_type": anomaly
    }
    await manager.broadcast(json.dumps(payload))

    if anomaly:
        # Auto-create incident via AI Triage logic
        incident = IncidentCreate(
            short_description=f"IoT Alert: {anomaly} detected on asset {data.asset_id}",
            location="Airport Terminal",
            area="Technical Room",
            department="Facilities",
            reported_via="IoT_Sensor"
        )
        await create_incident(incident)
        return {"status": "anomaly_detected", "type": anomaly, "action": "incident_created"}
    
    return {"status": "received", "anomaly": False}

@router.get("/history/{asset_id}")
def get_sensor_history(asset_id: str):
    return db_get_telemetry(asset_id)
