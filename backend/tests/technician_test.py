import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app

client = TestClient(app)

@patch("routers.technician.sn.get_incidents", new_callable=AsyncMock)
def test_get_my_tasks_valid(mock_get_incidents, admin_headers):
    mock_get_incidents.return_value = {"result": []}

    response = client.get("/api/v1/technician/tasks/john_doe", headers=admin_headers)
    assert response.status_code == 200
    mock_get_incidents.assert_called_once_with(query="assigned_to=john_doe^state!=6^state!=7")

@patch("routers.technician.sn.get_incidents", new_callable=AsyncMock)
def test_get_my_tasks_invalid(mock_get_incidents, admin_headers):
    mock_get_incidents.return_value = {"result": []}

    response = client.get("/api/v1/technician/tasks/john_doe^state=6", headers=admin_headers)
    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid assigned_to parameter"}
    mock_get_incidents.assert_not_called()

@patch("routers.technician.sn.get_incidents", new_callable=AsyncMock)
def test_get_my_stats_valid(mock_get_incidents, admin_headers):
    mock_get_incidents.return_value = {"result": []}

    response = client.get("/api/v1/technician/stats/jane_doe", headers=admin_headers)
    assert response.status_code == 200
    mock_get_incidents.assert_called_once_with(query="assigned_to=jane_doe", limit=100)

@patch("routers.technician.sn.get_incidents", new_callable=AsyncMock)
def test_get_my_stats_invalid(mock_get_incidents, admin_headers):
    mock_get_incidents.return_value = {"result": []}

    response = client.get("/api/v1/technician/stats/jane_doe%20OR%201=1", headers=admin_headers)
    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid assigned_to parameter"}
    mock_get_incidents.assert_not_called()
