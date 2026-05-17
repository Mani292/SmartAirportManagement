"""
test_health.py — Basic health and fallback DB tests.

Covers:
  - GET /health        → 200, status healthy
  - GET /              → 200, version field present
  - GET /api/v1/assets/   → 200 with fallback_db data (when ServiceNow is offline)
  - GET /api/v1/preventive/ → 200 with fallback_db data
  - GET /api/v1/qr/locations → 200 with fallback_db data
  - GET /api/v1/metrics/ → 200 with system metrics
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database
from fastapi.testclient import TestClient
from main import app

# Ensure DB tables exist before any test runs (mirrors the lifespan startup event)
database.init_db()

client = TestClient(app)

def get_token(username="admin", password="admin"):
    res = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    return res.json()["access_token"]


def test_health():
    """Health check must return status: healthy."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_root_has_version():
    """Root endpoint must return version and docs link."""
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "version" in data
    assert "docs" in data
    assert "auth" in data


def test_assets_fallback():
    """GET /api/v1/assets/ must always succeed (falls back to SQLite if ServiceNow is down)."""
    token = get_token()
    res = client.get("/api/v1/assets/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    # Must return a list (either from ServiceNow or SQLite fallback)
    assert "result" in data
    assert isinstance(data["result"], list)
    assert len(data["result"]) >= 1  # seeded default asset


def test_preventive_fallback():
    """GET /api/v1/preventive/ must always succeed."""
    token = get_token()
    res = client.get("/api/v1/preventive/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "result" in data
    assert isinstance(data["result"], list)
    assert len(data["result"]) >= 1  # seeded default task


def test_qr_locations_fallback():
    """GET /api/v1/qr/locations must always succeed."""
    token = get_token()
    res = client.get("/api/v1/qr/locations", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "result" in data
    assert isinstance(data["result"], list)
    assert len(data["result"]) >= 1  # seeded default location


def test_metrics_endpoint():
    """GET /api/v1/metrics/ should return system metrics."""
    token = get_token()
    res = client.get("/api/v1/metrics/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "system_status" in data
    assert "sla_compliance_rate" in data["metrics"]
