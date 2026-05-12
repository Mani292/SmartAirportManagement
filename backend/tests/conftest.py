"""
conftest.py — Shared pytest fixtures for Smart Airport Management test suite.

Provides:
  - `client`: FastAPI TestClient, initialized once per session.
  - `admin_token`: Valid JWT for admin user.
  - `manager_token`: Valid JWT for manager user.
  - `tech_token`: Valid JWT for technician user.
  - `seeded_db`: Ensures SQLite DB is initialized before any test runs.
"""

import os
import sys
import pytest

# Ensure backend root is importable without PYTHONPATH env var
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database
from fastapi.testclient import TestClient
from main import app

# ── Session-scoped: initialize DB once ────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def seeded_db():
    """Ensure all SQLite tables exist before the test session begins."""
    database.init_db()


# ── Session-scoped: single TestClient instance ────────────────────────────────

@pytest.fixture(scope="session")
def client(seeded_db):
    """Shared FastAPI TestClient — created once per test session."""
    with TestClient(app) as c:
        yield c


# ── Token fixtures ─────────────────────────────────────────────────────────────

def _login(client: TestClient, username: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def admin_token(client):
    return _login(client, "admin", "admin")


@pytest.fixture(scope="session")
def manager_token(client):
    return _login(client, "manager", "manager")


@pytest.fixture(scope="session")
def tech_token(client):
    return _login(client, "tech", "tech")


# ── Helper: auth headers ───────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def manager_headers(manager_token):
    return {"Authorization": f"Bearer {manager_token}"}


@pytest.fixture(scope="session")
def tech_headers(tech_token):
    return {"Authorization": f"Bearer {tech_token}"}
