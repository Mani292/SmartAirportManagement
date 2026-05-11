from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_ingest_sensor_data():
    response = client.post("/api/iot/sensor-data", json={
        "asset_id": "test_asset_1",
        "temperature": 85.0,
        "vibration": 10.0
    })
    assert response.status_code == 200
    assert response.json()["anomaly_status"] == "OVERHEATING"
