from datetime import datetime, timedelta
from typing import List, Optional

def predict_maintenance_need(asset_id: str, historical_vibration: List[float]) -> dict:
    """
    Enhanced Predictive maintenance engine.
    Analyzes historical sensor data to forecast the next required maintenance window
    using trend analysis (slope) and average-based risk assessment.
    """
    if not historical_vibration:
        return {"risk": "LOW", "days_until_failure": 30, "recommendation": "No history found. Maintain standard schedule."}
    
    avg_vib = sum(historical_vibration) / len(historical_vibration)
    
    # Trend Analysis: Calculate the slope of the last few readings
    slope = 0
    if len(historical_vibration) >= 3:
        # Simple slope: (last - first_in_window) / window_size
        recent = historical_vibration[-3:]
        slope = (recent[-1] - recent[0]) / 2

    # 1. Emergency Threshold (High risk regardless of trend)
    if avg_vib > 50:
        return {
            "risk": "HIGH",
            "days_until_failure": 3,
            "recommendation": "Emergency inspection required immediately. Average vibration exceeded critical limits."
        }

    # 2. Deteriorating Trend (Aggressive recommendation)
    if slope > 5.0: # Significant upward trend in vibration
        return {
            "risk": "HIGH",
            "days_until_failure": 5,
            "recommendation": "High Risk: Rapidly deteriorating vibration trend detected. Inspect within 5 days."
        }
    
    # 3. Medium Risk Threshold
    if avg_vib > 30 or slope > 2.0:
        return {
            "risk": "MEDIUM",
            "days_until_failure": 12,
            "recommendation": "Schedule maintenance within the next 2 weeks. Upward trend or elevated average detected."
        }
    
    # 4. Low Risk
    return {
        "risk": "LOW",
        "days_until_failure": 45,
        "recommendation": "Asset stable. Maintain standard monthly schedule."
    }
