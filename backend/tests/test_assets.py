from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch

client = TestClient(app)

@patch("servicenow.get_assets")
def test_list_assets_unauthorized(mock_get_assets):
    response = client.get("/api/assets/")
    assert response.status_code == 401

@patch("servicenow.get_assets")
def test_list_assets_authorized(mock_get_assets):
    mock_get_assets.return_value = {"result": [], "source": "mock"}

    # Login to get token
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin"
    })
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/assets/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json() == {"result": [], "source": "mock"}
