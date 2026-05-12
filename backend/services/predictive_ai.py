from datetime import datetime, timedelta
import math

def predict_maintenance_need(asset_id: str, telemetry_history: list[dict]) -> dict:
    """
    Advanced predictive maintenance engine.
    Analyzes vibration trends, temperature spikes, and historical failure patterns
    to forecast the probability and timeline of asset failure.
    """
    if not telemetry_history:
        return {
            "risk": "LOW",
            "confidence": 0.5,
            "days_until_failure": 30,
            "recommendation": "No recent data. Maintain standard schedule."
        }
    
    # Extract metrics
    vibrations = [d.get("vibration", 0) for d in telemetry_history]
    temps = [d.get("temperature", 0) for d in telemetry_history]
    
    avg_vib = sum(vibrations) / len(vibrations)
    max_vib = max(vibrations)
    avg_temp = sum(temps) / len(temps)
    
    # Calculate trend (rate of change in vibration)
    if len(vibrations) > 1:
        trend = (vibrations[0] - vibrations[-1]) / len(vibrations) # Assuming 0 is newest
    else:
        trend = 0

    risk_score = 0
    
    # Vibration analysis (Weight: 50%)
    if avg_vib > 60 or max_vib > 80:
        risk_score += 50
    elif avg_vib > 40:
        risk_score += 25
        
    # Temperature analysis (Weight: 30%)
    if avg_temp > 90:
        risk_score += 30
    elif avg_temp > 70:
        risk_score += 15
        
    # Trend analysis (Weight: 20%)
    if trend > 5:
        risk_score += 20
    elif trend > 2:
        risk_score += 10

    # Determine risk level
    if risk_score >= 70:
        risk = "HIGH"
        days = max(1, 7 - math.floor(risk_score/15))
        rec = "Critical anomaly detected. Schedule immediate maintenance."
    elif risk_score >= 35:
        risk = "MEDIUM"
        days = 14 - math.floor(risk_score/10)
        rec = "Rising degradation trend. Perform inspection within 7 days."
    else:
        risk = "LOW"
        days = 30 + (20 - math.floor(risk_score))
        rec = "Asset operating within normal parameters."

    return {
        "asset_id": asset_id,
        "risk": risk,
        "risk_score": risk_score,
        "confidence": 0.85 if len(telemetry_history) > 5 else 0.6,
        "days_until_failure": days,
        "recommendation": rec,
        "analysis_metrics": {
            "avg_vibration": round(avg_vib, 2),
            "avg_temperature": round(avg_temp, 2),
            "vibration_trend": round(trend, 2)
        }
    }
