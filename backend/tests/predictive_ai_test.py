import pytest
from services.predictive_ai import predict_maintenance_need

def test_predict_maintenance_need_high_risk():
    res = predict_maintenance_need("asset_1", [
        {"vibration": 55.0, "temperature": 80},
        {"vibration": 60.0, "temperature": 82},
        {"vibration": 52.0, "temperature": 79},
        {"vibration": 65.0, "temperature": 85},
        {"vibration": 68.0, "temperature": 88}
    ])
    assert res["risk"] == "HIGH"

def test_predict_maintenance_need_medium_risk():
    res = predict_maintenance_need("asset_2", [
        {"vibration": 35.0, "temperature": 60},
        {"vibration": 40.0, "temperature": 60},
        {"vibration": 32.0, "temperature": 60},
        {"vibration": 45.0, "temperature": 60},
        {"vibration": 48.0, "temperature": 60}
    ])
    assert res["risk"] == "MEDIUM"

def test_predict_maintenance_need_low_risk():
    res = predict_maintenance_need("asset_3", [
        {"vibration": 10.0, "temperature": 20},
        {"vibration": 15.0, "temperature": 22},
        {"vibration": 12.0, "temperature": 21},
        {"vibration": 10.0, "temperature": 20},
        {"vibration": 11.0, "temperature": 20}
    ])
    assert res["risk"] == "LOW"

def test_predict_maintenance_need_empty():
    res = predict_maintenance_need("asset_4", [])
    assert res["risk"] == "LOW"
    assert res["days_until_failure"] == 30
