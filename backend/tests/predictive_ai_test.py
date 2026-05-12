import pytest
from backend.services.predictive_ai import predict_maintenance_need

def test_predict_maintenance_need_high_risk():
    res = predict_maintenance_need("asset_1", [55.0, 60.0, 52.0])
    assert res["risk"] == "HIGH"
    assert res["days_until_failure"] == 3
    assert "Emergency" in res["recommendation"]

def test_predict_maintenance_need_medium_risk():
    res = predict_maintenance_need("asset_2", [35.0, 40.0, 32.0])
    assert res["risk"] == "MEDIUM"
    assert res["days_until_failure"] == 12
    assert "2 weeks" in res["recommendation"]

def test_predict_maintenance_need_low_risk():
    res = predict_maintenance_need("asset_3", [10.0, 15.0, 12.0])
    assert res["risk"] == "LOW"
    assert res["days_until_failure"] == 45
    assert "standard" in res["recommendation"]

def test_predict_maintenance_need_empty():
    res = predict_maintenance_need("asset_4", [])
    assert res["risk"] == "LOW"
    assert res["days_until_failure"] == 30
