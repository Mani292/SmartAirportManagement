import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import global_exception_handler

# Create an isolated test application
isolated_app = FastAPI()

# Attach the exception handler to test
@isolated_app.exception_handler(Exception)
async def custom_exception_handler(request: Request, exc: Exception):
    return await global_exception_handler(request, exc)

# Mount a temporary route to trigger an exception
@isolated_app.get("/trigger-error-test")
def trigger_error():
    raise Exception("Test exception message")

@pytest.fixture
def test_client_no_raise():
    # Pass raise_server_exceptions=False so the TestClient doesn't raise the error
    # but instead returns the 500 response from the exception handler.
    with TestClient(isolated_app, raise_server_exceptions=False) as c:
        yield c

def test_global_exception_handler_env_dev(monkeypatch, test_client_no_raise: TestClient):
    monkeypatch.setenv("DEBUG", "true")
    res = test_client_no_raise.get("/trigger-error-test")
    assert res.status_code == 500
    data = res.json()
    assert data["success"] is False
    assert data["message"] == "Internal Server Error"
    assert data["detail"] == "Test exception message"

def test_global_exception_handler_env_prod(monkeypatch, test_client_no_raise: TestClient):
    monkeypatch.setenv("DEBUG", "false")
    res = test_client_no_raise.get("/trigger-error-test")
    assert res.status_code == 500
    data = res.json()
    assert data["success"] is False
    assert data["message"] == "Internal Server Error"
    assert data["detail"] == "An unexpected error occurred."
