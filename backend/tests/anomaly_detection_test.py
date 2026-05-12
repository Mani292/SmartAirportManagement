import pytest
from backend.services.anomaly_detection import detect_anomaly

def test_detect_anomaly_none():
    # Normal values
    assert detect_anomaly(70.0, 30.0) is None
    # Boundary values
    assert detect_anomaly(75.0, 40.0) is None
    assert detect_anomaly(85.0, 30.0) is None
    assert detect_anomaly(70.0, 60.0) is None

def test_detect_anomaly_overheating():
    assert detect_anomaly(85.1, 30.0) == "OVERHEATING"
    assert detect_anomaly(100.0, 70.0) == "OVERHEATING"

def test_detect_anomaly_vibration():
    assert detect_anomaly(70.0, 60.1) == "EXCESSIVE_VIBRATION"
    assert detect_anomaly(80.0, 65.0) == "EXCESSIVE_VIBRATION"

def test_detect_anomaly_high_wear_risk():
    assert detect_anomaly(75.1, 40.1) == "HIGH_WEAR_RISK"

def test_detect_anomaly_statistical_vibration():
    # Mean vib = 30.0, StdDev = 0.0
    # But code has stdev_vib > 0.1 check
    history = [
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 31.0, "temperature": 70.0},
        {"vibration": 29.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
    ]
    # mean ~ 30, stdev ~ 0.63
    # z-score for 40.0 = (40-30)/0.63 = 15.8 > 3.0
    assert detect_anomaly(70.0, 40.0, history) == "STATISTICAL_VIBRATION_OUTLIER"

def test_detect_anomaly_statistical_temperature():
    history = [
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 71.0},
        {"vibration": 30.0, "temperature": 69.0},
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
    ]
    # z-score for 80.0 will be high
    assert detect_anomaly(80.0, 30.0, history) == "STATISTICAL_TEMPERATURE_OUTLIER"

def test_detect_anomaly_precedence():
    # Hard threshold > Statistical
    history = [
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
        {"vibration": 30.0, "temperature": 70.0},
    ]
    # 86.0 is OVERHEATING (hard) and statistical outlier
    assert detect_anomaly(86.0, 30.0, history) == "OVERHEATING"
