import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from backend.main import app

client = TestClient(app)

@patch("backend.routers.incidents.run_in_threadpool", new_callable=AsyncMock)
def test_create_incident_integration(mock_run):
    # Mock return values for AI Triage and ServiceNow creation
    mock_triage = {
        "assigned_team": "Electrical",
        "category": "Facilities",
        "priority": "2",
        "estimated_fix_mins": 45,
        "safety_risk": False,
        "recommended_action": "Check breaker"
    }
    mock_result = {
        "result": {
            "number": "INC0010001",
            "sys_id": "sys123"
        }
    }

    # mock_run is called multiple times: triage, create_incident, whatsapp, email
    mock_run.side_effect = [mock_triage, mock_result, True, True]

    payload = {
        "short_description": "Flickering lights in terminal 1",
        "location": "Terminal 1",
        "area": "Gate A5",
        "department": "Facilities",
        "reporter_phone": "+1234567890",
        "reporter_email": "test@example.com"
    }

    response = client.post("/api/incidents/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["incident_number"] == "INC0010001"
    assert data["ai_triage"]["assigned_team"] == "Electrical"

@patch("backend.routers.iot.detect_anomaly")
@patch("backend.routers.iot.db_log_telemetry")
@patch("backend.routers.iot.create_incident", new_callable=AsyncMock)
def test_iot_anomaly_trigger_incident(mock_create_inc, mock_log, mock_detect):
    mock_detect.return_value = "OVERHEATING"

    payload = {
        "asset_id": "ASSET123",
        "temperature": 90.0,
        "vibration": 30.0
    }

    response = client.post("/api/iot/sensor-data", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "anomaly_detected"
    assert data["type"] == "OVERHEATING"
    mock_create_inc.assert_called_once()
