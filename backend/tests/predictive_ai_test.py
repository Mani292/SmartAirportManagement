import pytest
from backend.services.predictive_ai import predict_maintenance_need

def test_predict_maintenance_need_empty():
    result = predict_maintenance_need("A1", [])
    assert result["risk"] == "LOW"
    assert "No history" in result["recommendation"]

def test_predict_maintenance_need_low():
    result = predict_maintenance_need("A1", [10.0, 10.0, 10.0])
    assert result["risk"] == "LOW"
    assert "stable" in result["recommendation"]

def test_predict_maintenance_need_high_avg():
    result = predict_maintenance_need("A1", [51.0, 52.0, 53.0])
    assert result["risk"] == "HIGH"
    assert "Emergency" in result["recommendation"]

def test_predict_maintenance_need_high_trend():
    # slope = (40 - 20) / 2 = 10.0 > 5.0
    result = predict_maintenance_need("A1", [20.0, 30.0, 40.0])
    assert result["risk"] == "HIGH"
    assert "deteriorating" in result["recommendation"]

def test_predict_maintenance_need_medium_trend():
    # slope = (26 - 20) / 2 = 3.0 > 2.0
    result = predict_maintenance_need("A1", [20.0, 23.0, 26.0])
    assert result["risk"] == "MEDIUM"
    assert "Upward trend" in result["recommendation"]
