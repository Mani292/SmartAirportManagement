import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app

client = TestClient(app)

@patch("routers.assets.sn.get_assets", new_callable=AsyncMock)
def test_list_assets_success(mock_get_assets, admin_headers):
    # Mock return value for successful ServiceNow asset retrieval
    mock_get_assets.return_value = {
        "result": [
            {
                "sys_id": "asset123",
                "u_name": "Elevator T1-A",
                "u_type": "Elevator",
                "u_airport_id": "SJC-01"
            }
        ]
    }

    response = client.get("/api/v1/assets/", headers=admin_headers)

    assert response.status_code == 200
    data = response.json()
    assert "result" in data
    assert len(data["result"]) == 1
    assert data["result"][0]["u_name"] == "Elevator T1-A"
    mock_get_assets.assert_called_once()


@patch("routers.assets.sn.get_assets", new_callable=AsyncMock)
@patch("routers.assets.db.db_get_assets")
def test_list_assets_fallback(mock_db_get_assets, mock_get_assets, admin_headers):
    # Mock ServiceNow failure
    mock_get_assets.return_value = {
        "error": "connection_failed",
        "detail": "ServiceNow is unreachable"
    }

    # Mock SQLite fallback return value
    mock_db_get_assets.return_value = [
        {
            "sys_id": "asset456",
            "name": "HVAC T2-B",
            "asset_type": "HVAC",
            "airport_id": "TEST-01"
        }
    ]

    # Call with a custom airport_id to verify it's passed correctly
    response = client.get("/api/v1/assets/?airport_id=TEST-01", headers=admin_headers)

    assert response.status_code == 200
    data = response.json()
    assert "result" in data
    assert data["source"] == "fallback_db"
    assert len(data["result"]) == 1
    assert data["result"][0]["name"] == "HVAC T2-B"

    mock_get_assets.assert_called_once()
    mock_db_get_assets.assert_called_once_with(airport_id="TEST-01")
