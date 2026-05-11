from fastapi import APIRouter
from pydantic import BaseModel
from services.anomaly_detection import detect_anomaly

router = APIRouter()

class SensorData(BaseModel):
    asset_id: str
    temperature: float
    vibration: float

@router.post("/sensor-data")
def ingest_sensor_data(data: SensorData):
    status = detect_anomaly(data.temperature, data.vibration)
    return {"status": "received", "anomaly_status": status, "asset_id": data.asset_id}
