from fastapi import APIRouter
from pydantic import BaseModel
from services.anomaly_detection import detect_anomaly
from routers.incidents import create_incident, IncidentCreate
from fastapi import Request
import asyncio

router = APIRouter()

class SensorData(BaseModel):
    asset_id: str
    temperature: float
    vibration: float

@router.post("/sensor-data")
async def ingest_sensor_data(request: Request, data: SensorData):
    status = detect_anomaly(data.temperature, data.vibration)
    if status != "NORMAL":
        incident_data = IncidentCreate(
            short_description=f"Automated Anomaly Detected: {status}",
            location="Unknown",
            area="System",
            department="Facilities"
        )
        # Handle async call to sync function
        await asyncio.to_thread(create_incident, request, incident_data, {"role": "system", "username": "iot_system"})
    return {"status": "received", "anomaly_status": status, "asset_id": data.asset_id}
