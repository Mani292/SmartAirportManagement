from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch

client = TestClient(app)

@patch("routers.iot.create_incident")
def test_ingest_sensor_data(mock_create_incident):
    mock_create_incident.return_value = {"success": True}
    response = client.post("/api/iot/sensor-data", json={
        "asset_id": "test_asset_1",
        "temperature": 85.0,
        "vibration": 10.0
    })
    assert response.status_code == 200
    assert response.json()["anomaly_status"] == "OVERHEATING"
