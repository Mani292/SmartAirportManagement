import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from main import app

client = TestClient(app)

@patch("routers.incidents.llm.triage_incident", new_callable=AsyncMock)
@patch("routers.incidents.sn.create_incident", new_callable=AsyncMock)
@patch("routers.incidents.send_confirmation", new_callable=AsyncMock)
@patch("routers.incidents.run_in_threadpool", new_callable=AsyncMock)
def test_create_incident_integration(mock_run, mock_wa, mock_create, mock_triage, admin_headers):
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

    response = client.post("/api/v1/incidents/", json=payload, headers=admin_headers)

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

@patch("routers.incidents.sn.get_incident", new_callable=AsyncMock)
def test_get_incident_success(mock_get_incident, client, admin_headers):
    mock_get_incident.return_value = {
        "result": {
            "number": "INC0010002",
            "sys_id": "sys456",
            "assigned_to": {
                "display_value": "John Doe",
                "value": "user123"
            },
            "location": {
                "value": "loc_sys_id"
            }
        }
    }

    response = client.get("/api/v1/incidents/sys456", headers=admin_headers)
    assert response.status_code == 200

    data = response.json()
    assert "result" in data
    assert data["result"]["number"] == "INC0010002"
    # Verify cleanup_snow_record worked
    assert data["result"]["assigned_to"] == "John Doe"
    assert data["result"]["location"] == "loc_sys_id"

    mock_get_incident.assert_called_once_with("sys456")


@patch("routers.incidents.sn.get_incident", new_callable=AsyncMock)
def test_get_incident_not_found(mock_get_incident, client, admin_headers):
    mock_get_incident.return_value = {
        "error": {
            "message": "No Record found",
            "detail": "Record doesn't exist or ACL restricts the record retrieval"
        },
        "status": "failure"
    }

    response = client.get("/api/v1/incidents/invalid_id", headers=admin_headers)
    assert response.status_code == 200

    data = response.json()
    assert "error" in data
    assert data["status"] == "failure"
    assert data["error"]["message"] == "No Record found"

    mock_get_incident.assert_called_once_with("invalid_id")


@patch("routers.incidents.sn.update_incident", new_callable=AsyncMock)
def test_rate_incident_success(mock_update_incident, client, admin_headers):
    mock_update_incident.return_value = {
        "result": {
            "sys_id": "sys789",
            "u_passenger_rating": "5",
            "u_rating_comment": "Great service!"
        }
    }

    payload = {
        "rating": 5,
        "comment": "Great service!"
    }

    response = client.post("/api/v1/incidents/sys789/rate", json=payload, headers=admin_headers)
    assert response.status_code == 200

    data = response.json()
    assert "result" in data
    assert data["result"]["u_passenger_rating"] == "5"

    mock_update_incident.assert_called_once_with("sys789", {
        "u_passenger_rating": "5",
        "u_rating_comment": "Great service!"
    })


@patch("routers.incidents.sn.update_incident", new_callable=AsyncMock)
def test_rate_incident_no_comment(mock_update_incident, client, admin_headers):
    mock_update_incident.return_value = {
        "result": {
            "sys_id": "sys789",
            "u_passenger_rating": "3",
            "u_rating_comment": ""
        }
    }

    payload = {
        "rating": 3
    }

    response = client.post("/api/v1/incidents/sys789/rate", json=payload, headers=admin_headers)
    assert response.status_code == 200

    mock_update_incident.assert_called_once_with("sys789", {
        "u_passenger_rating": "3",
        "u_rating_comment": ""
    })
