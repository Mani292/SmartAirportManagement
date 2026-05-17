import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from main import app

client = TestClient(app)

@patch("routers.incidents.llm.triage_incident", new_callable=AsyncMock)
@patch("routers.incidents.sn.create_incident", new_callable=AsyncMock)
@patch("routers.incidents.send_confirmation", new_callable=AsyncMock)
@patch("routers.incidents.run_in_threadpool", new_callable=AsyncMock)
def test_create_incident_integration(mock_run, mock_wa, mock_create, mock_triage):
    # Mock return values for AI Triage and ServiceNow creation
    mock_triage.return_value = {
        "assigned_team": "Electrical",
        "category": "Facilities",
        "priority": "2",
        "estimated_fix_mins": 45,
        "safety_risk": False,
        "recommended_action": "Check breaker"
    }
    mock_create.return_value = {
        "result": {
            "number": "INC0010001",
            "sys_id": "sys123"
        }
    }
    mock_wa.return_value = True
    mock_run.return_value = True

    payload = {
        "short_description": "Flickering lights in terminal 1",
        "location": "Terminal 1",
        "area": "Gate A5",
        "department": "Facilities",
        "reporter_phone": "+1234567890",
        "reporter_email": "test@example.com"
    }

    response = client.post("/api/v1/incidents/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["incident_number"] == "INC0010001"
    assert data["ai_triage"]["assigned_team"] == "Electrical"

@patch("routers.iot.detect_anomaly")
@patch("routers.iot.db_log_telemetry")
@patch("routers.iot.create_incident", new_callable=AsyncMock)
def test_iot_anomaly_trigger_incident(mock_create_inc, mock_log, mock_detect):
    mock_detect.return_value = {
        "anomaly_type": "OVERHEATING",
        "severity": "HIGH",
        "message": "High temp",
        "z_score": 3.5
    }

    payload = {
        "asset_id": "ASSET123",
        "temperature": 90.0,
        "vibration": 30.0
    }

    response = client.post("/api/v1/iot/telemetry", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "anomaly_detected"
    assert data["anomaly_type"] == "OVERHEATING"
    mock_create_inc.assert_called_once()
