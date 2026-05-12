import pytest
from backend.services.predictive_ai import predict_maintenance_need

def test_predict_maintenance_need_empty():
    result = predict_maintenance_need("A1", [])
    assert result["risk"] == "LOW"
    assert result["days_until_failure"] == 30

def test_predict_maintenance_need_low():
    result = predict_maintenance_need("A1", [10.0, 20.0, 15.0])
    assert result["risk"] == "LOW"
    assert result["days_until_failure"] == 45
    assert "standard" in result["recommendation"]

def test_predict_maintenance_need_medium():
    result = predict_maintenance_need("A1", [35.0, 40.0, 30.0]) # avg = 35
    assert result["risk"] == "MEDIUM"
    assert result["days_until_failure"] == 12
    assert "2 weeks" in result["recommendation"]

def test_predict_maintenance_need_high():
    result = predict_maintenance_need("A1", [60.0, 70.0, 50.0]) # avg = 60
    assert result["risk"] == "HIGH"
    assert result["days_until_failure"] == 3
    assert "Emergency" in result["recommendation"]
