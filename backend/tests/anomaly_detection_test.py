import pytest
from backend.services.anomaly_detection import detect_anomaly

def test_detect_anomaly_none():
    # Normal values
    assert detect_anomaly(70.0, 30.0) is None
    # Boundary values
    assert detect_anomaly(75.0, 40.0) is None # 75 not > 75, 40 not > 40
    assert detect_anomaly(85.0, 30.0) is None # 85 not > 85, but 85 > 75 and 30 > 40 is false
    assert detect_anomaly(70.0, 60.0) is None # 60 not > 60, but 70 > 75 and 60 > 40 is false

def test_detect_anomaly_overheating():
    assert detect_anomaly(85.1, 30.0) == "OVERHEATING"
    assert detect_anomaly(100.0, 70.0) == "OVERHEATING" # Overheating has priority

def test_detect_anomaly_vibration():
    assert detect_anomaly(70.0, 60.1) == "EXCESSIVE_VIBRATION"
    assert detect_anomaly(80.0, 65.0) == "EXCESSIVE_VIBRATION" # Excessive vibration has priority over HIGH_WEAR_RISK

def test_detect_anomaly_high_wear_risk():
    assert detect_anomaly(75.1, 40.1) == "HIGH_WEAR_RISK"
    assert detect_anomaly(85.0, 40.1) == "HIGH_WEAR_RISK" # 85 not > 85, 85 > 75 and 40.1 > 40
    assert detect_anomaly(75.1, 60.0) == "HIGH_WEAR_RISK" # 60 not > 60, 75.1 > 75 and 60 > 40

def test_detect_anomaly_precedence():
    # OVERHEATING > EXCESSIVE_VIBRATION
    assert detect_anomaly(86.0, 61.0) == "OVERHEATING"
    # EXCESSIVE_VIBRATION > HIGH_WEAR_RISK
    assert detect_anomaly(76.0, 61.0) == "EXCESSIVE_VIBRATION"
