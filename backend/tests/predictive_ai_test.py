import pytest
from services.predictive_ai import (
    calculate_trend,
    calculate_risk_score,
    estimate_rul,
    determine_recommendation,
    predict_maintenance_need,
)


def test_calculate_trend_empty():
    assert calculate_trend([]) == 0.0


def test_calculate_trend_constant():
    assert calculate_trend([10.0, 10.0, 10.0]) == 0.0


def test_calculate_trend_linear():
    # x = [0, 1, 2], y = [1, 2, 3], slope = 1.0
    assert pytest.approx(calculate_trend([1.0, 2.0, 3.0])) == 1.0


def test_calculate_risk_score():
    # Low risk
    score_low = calculate_risk_score(avg_vib=20.0, vib_trend=0.0, avg_temp=50.0, temp_trend=0.0)
    assert score_low == 0

    # High risk combination
    score_high = calculate_risk_score(avg_vib=65.0, vib_trend=6.0, avg_temp=90.0, temp_trend=1.5)
    # vib>60 (+40), vib_trend>5 (+60), temp>85 (+20) = 120
    assert score_high == 120


def test_estimate_rul():
    # Low trend -> default 30 days
    assert estimate_rul(0.05) == 30

    # High trend -> reduced RUL
    rul = estimate_rul(4.0)
    # degradation_rate = 2.0, 30 / 3 = 10
    assert rul == 10


def test_determine_recommendation():
    risk, rec = determine_recommendation(risk_score=70, vib_trend=2.0)
    assert risk == "HIGH"
    assert "CRITICAL" in rec

    risk, rec = determine_recommendation(risk_score=25, vib_trend=0.5)
    assert risk == "MEDIUM"
    assert "MODERATE" in rec

    risk, rec = determine_recommendation(risk_score=0, vib_trend=0.0)
    assert risk == "LOW"
    assert "NORMAL" in rec


def test_predict_maintenance_need_high_risk():
    res = predict_maintenance_need(
        "asset_1",
        [
            {"vibration": 55.0, "temperature": 80},
            {"vibration": 60.0, "temperature": 82},
            {"vibration": 52.0, "temperature": 79},
            {"vibration": 65.0, "temperature": 85},
            {"vibration": 68.0, "temperature": 88},
        ],
    )
    assert res["risk"] == "HIGH"
    assert "risk_score" in res
    assert res["confidence"] > 0.5


def test_predict_maintenance_need_medium_risk():
    res = predict_maintenance_need(
        "asset_2",
        [
            {"vibration": 35.0, "temperature": 60},
            {"vibration": 40.0, "temperature": 60},
            {"vibration": 32.0, "temperature": 60},
            {"vibration": 45.0, "temperature": 60},
            {"vibration": 48.0, "temperature": 60},
        ],
    )
    assert res["risk"] == "MEDIUM"


def test_predict_maintenance_need_low_risk():
    res = predict_maintenance_need(
        "asset_3",
        [
            {"vibration": 10.0, "temperature": 20},
            {"vibration": 15.0, "temperature": 22},
            {"vibration": 12.0, "temperature": 21},
            {"vibration": 10.0, "temperature": 20},
            {"vibration": 11.0, "temperature": 20},
        ],
    )
    assert res["risk"] == "LOW"


def test_predict_maintenance_need_empty():
    res = predict_maintenance_need("asset_4", [])
    assert res["risk"] == "LOW"
    assert res["days_until_failure"] == 30


def test_predict_maintenance_need_insufficient_samples():
    res = predict_maintenance_need(
        "asset_5",
        [
            {"vibration": 10.0, "temperature": 20},
            {"vibration": 15.0, "temperature": 22},
        ],
    )
    assert res["risk"] == "LOW"
    assert res["confidence"] == 0.4
    assert res["days_until_failure"] == 30
