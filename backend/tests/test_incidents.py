from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch

client = TestClient(app)

@patch("servicenow.get_incidents")
def test_list_incidents_unauthorized(mock_get_incidents):
    response = client.get("/api/incidents/")
    assert response.status_code == 401

@patch("servicenow.get_incidents")
def test_list_incidents_authorized(mock_get_incidents):
    mock_get_incidents.return_value = {"result": [{"number": "INC001", "state": "1"}]}

    # Login to get token
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin"
    })
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/incidents/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["result"][0]["number"] == "INC001"
