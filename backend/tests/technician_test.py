import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app

client = TestClient(app, raise_server_exceptions=False)

def test_get_my_tasks_valid_assigned_to(admin_headers):
    # Mock the get_incidents response from servicenow
    with patch("servicenow.get_incidents", new_callable=AsyncMock) as mock_get_incidents:
        mock_get_incidents.return_value = {"result": []}

        # Valid assigned_to: alphanumeric, space, underscore, hyphen
        response = client.get("/api/v1/technician/tasks/Tech-1_Name", headers=admin_headers)

        assert response.status_code == 200
        mock_get_incidents.assert_called_once()
        assert "assigned_to=Tech-1_Name" in mock_get_incidents.call_args.kwargs["query"]

def test_get_my_tasks_invalid_assigned_to(admin_headers):
    # The assigned_to has a disallowed character: ^
    response = client.get("/api/v1/technician/tasks/Tech^Name", headers=admin_headers)

    # Validation should fail, resulting in a 400 Bad Request
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid assigned_to parameter"

def test_get_my_stats_valid_assigned_to(admin_headers):
    with patch("servicenow.get_incidents", new_callable=AsyncMock) as mock_get_incidents:
        mock_get_incidents.return_value = {"result": []}

        # Valid assigned_to
        response = client.get("/api/v1/technician/stats/Tech-1_Name", headers=admin_headers)

        assert response.status_code == 200
        mock_get_incidents.assert_called_once()
        assert mock_get_incidents.call_args.kwargs["query"] == "assigned_to=Tech-1_Name"

def test_get_my_stats_invalid_assigned_to(admin_headers):
    # The assigned_to has a disallowed character: ^
    response = client.get("/api/v1/technician/stats/Tech^Name", headers=admin_headers)

    # Validation should fail, resulting in a 400 Bad Request
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid assigned_to parameter"
