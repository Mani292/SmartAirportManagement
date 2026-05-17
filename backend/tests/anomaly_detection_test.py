import pytest
from services.anomaly_detection import detect_anomaly

def test_detect_anomaly_none():
    # Normal values
    assert detect_anomaly(70.0, 30.0) is None
    # Boundary values
    assert detect_anomaly(75.0, 40.0) is None
    assert detect_anomaly(85.0, 30.0) is None
    assert detect_anomaly(70.0, 60.0) is None

def test_detect_anomaly_overheating():
    res = detect_anomaly(86.0, 30.0)
    assert res is not None
    assert res["anomaly_type"] == "OVERHEATING"

def test_detect_anomaly_vibration():
    res = detect_anomaly(70.0, 65.0)
    assert res is not None
    assert res["anomaly_type"] == "EXCESSIVE_VIBRATION"

def test_detect_anomaly_high_wear_risk():
    res = detect_anomaly(75.0, 45.0, humidity=80.0)
    assert res is not None
    assert res["anomaly_type"] == "HIGH_WEAR_RISK"

def test_detect_anomaly_statistical_vibration():
    history = [
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 31.0, "temperature": 70.0},
        {"vibration": 29.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
    ]
    res = detect_anomaly(70.0, 40.0, history)
    assert res is not None
    assert res["anomaly_type"] == "VIBRATION_ANOMALY"

def test_detect_anomaly_statistical_temperature():
    history = [
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 71.0},
        {"vibration": 30.0, "temperature": 69.0},
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
    ]
    res = detect_anomaly(80.0, 30.0, history)
    assert res is not None
    assert res["anomaly_type"] == "THERMAL_ANOMALY"

def test_detect_anomaly_precedence():
    history = [
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
    ]
    # 105.0 is CRITICAL_FAILURE_IMMINENT (hard threshold) and statistical outlier
    res = detect_anomaly(105.0, 30.0, history)
    assert res is not None
    assert res["anomaly_type"] == "CRITICAL_FAILURE_IMMINENT"
