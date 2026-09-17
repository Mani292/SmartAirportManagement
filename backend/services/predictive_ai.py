import math
import statistics


def calculate_trend(data: list[float]) -> float:
    """Calculates linear regression slope for a time series dataset."""
    n = len(data)
    if n == 0:
        return 0.0
    x = list(range(n))
    y = data
    x_mean = sum(x) / n
    y_mean = sum(y) / n
    numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    return (numerator / denominator) if denominator != 0 else 0.0


def calculate_risk_score(
    avg_vib: float, vib_trend: float, avg_temp: float, temp_trend: float
) -> int:
    """Calculates composite risk score based on vibration and temperature baselines and trends."""
    risk_score = 0

    # Current magnitude risk
    if avg_vib > 60:
        risk_score += 40
    elif avg_vib > 40:
        risk_score += 20

    # Trend risk - Accelerating degradation is a major factor
    if vib_trend > 5.0:
        risk_score += 60  # Rapid acceleration
    elif vib_trend > 1.0:
        risk_score += 40
    elif vib_trend > 0.3:
        risk_score += 20

    # Temperature risk
    if avg_temp > 85 or temp_trend > 1.0:
        risk_score += 20
    elif avg_temp > 75:
        risk_score += 10

    return risk_score


def estimate_rul(vib_trend: float) -> int:
    """Estimates Remaining Useful Life (RUL) in days from vibration trend."""
    if vib_trend < 0.1:
        return 30

    # Faster degradation for higher trends
    degradation_rate = max(0.0, vib_trend * 0.5)
    return max(1, math.floor(30 / (1 + degradation_rate)))


def determine_recommendation(risk_score: int, vib_trend: float) -> tuple[str, str]:
    """Determines risk classification level and maintenance recommendation string."""
    if risk_score >= 60 or vib_trend > 8.0:
        risk = "HIGH"
        rec = f"CRITICAL: High degradation trend (+{round(vib_trend, 2)}/sample) detected. Maintenance required."
    elif risk_score >= 20:
        risk = "MEDIUM"
        rec = "MODERATE: Signs of wear detected. Increasing trend identified."
    else:
        risk = "LOW"
        rec = "NORMAL: Asset operating within statistical control limits."

    return risk, rec


def predict_maintenance_need(asset_id: str, telemetry_history: list[dict]) -> dict:
    """
    Enterprise-grade predictive maintenance engine using Statistical Trend Analysis.
    Calculates rate of degradation and estimates Remaining Useful Life (RUL).
    """
    if not telemetry_history or len(telemetry_history) < 5:
        return {
            "asset_id": asset_id,
            "risk": "LOW",
            "confidence": 0.4,
            "days_until_failure": 30,
            "recommendation": "Insufficient data for statistical forecasting. Following standard 30-day cycle.",
        }

    # 1. Extract Metrics
    vibrations = [d.get("vibration", 0) for d in telemetry_history]
    temps = [d.get("temperature", 0) for d in telemetry_history]

    # 2. Statistical Baselines
    avg_vib = statistics.mean(vibrations)
    avg_temp = statistics.mean(temps)

    # 3. Simple Linear Regression (Trend Detection)
    vib_trend = calculate_trend(vibrations)
    temp_trend = calculate_trend(temps)

    # 4. Risk Scoring Matrix
    risk_score = calculate_risk_score(avg_vib, vib_trend, avg_temp, temp_trend)

    # 5. RUL Estimation (Remaining Useful Life)
    rul_days = estimate_rul(vib_trend)

    # 6. Recommendation Engine
    risk, rec = determine_recommendation(risk_score, vib_trend)

    return {
        "asset_id": asset_id,
        "risk": risk,
        "risk_score": risk_score,
        "confidence": min(0.95, 0.5 + (len(telemetry_history) * 0.05)),
        "days_until_failure": rul_days,
        "recommendation": rec,
        "analysis_metrics": {
            "avg_vibration": round(avg_vib, 2),
            "vibration_trend": round(vib_trend, 3),
            "sample_size": len(telemetry_history),
        },
    }
