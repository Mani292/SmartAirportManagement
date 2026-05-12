import math
from typing import Optional, List

def detect_anomaly(
    temperature: float,
    vibration: float,
    history: Optional[List[dict]] = None
) -> str | None:
    """
    Enhanced Predictive AI logic to detect anomalies in airport asset sensors.
    Uses a hybrid approach:
    1. Hard thresholds (Safety Baseline)
    2. Statistical Outlier Detection (Z-score for vibration/temp over recent history)
    """

    # 1. Hard thresholds (Safety Baseline - Highest Priority)
    if temperature > 85:
        return "OVERHEATING"
    
    if vibration > 60:
        return "EXCESSIVE_VIBRATION"
    
    # 2. Combined risk factor
    if temperature > 75 and vibration > 40:
        return "HIGH_WEAR_RISK"
    
    # 3. Statistical Anomaly Detection (if history is provided)
    if history and len(history) >= 5:
        # Extract values
        temp_history = [h.get("temperature", 0) for h in history if h.get("temperature") is not None]
        vib_history = [h.get("vibration", 0) for h in history if h.get("vibration") is not None]

        # Check Vibration Anomaly (Z-score)
        if len(vib_history) >= 5:
            mean_vib = sum(vib_history) / len(vib_history)
            variance_vib = sum((x - mean_vib) ** 2 for x in vib_history) / len(vib_history)
            stdev_vib = math.sqrt(variance_vib)

            if stdev_vib > 0.1: # Avoid division by zero/static data
                z_score = (vibration - mean_vib) / stdev_vib
                if z_score > 3.0: # 3-sigma rule for outliers
                    return "STATISTICAL_VIBRATION_OUTLIER"

        # Check Temperature Anomaly (Z-score)
        if len(temp_history) >= 5:
            mean_temp = sum(temp_history) / len(temp_history)
            variance_temp = sum((x - mean_temp) ** 2 for x in temp_history) / len(temp_history)
            stdev_temp = math.sqrt(variance_temp)

            if stdev_temp > 0.1:
                z_score = (temperature - mean_temp) / stdev_temp
                if z_score > 3.0:
                    return "STATISTICAL_TEMPERATURE_OUTLIER"

    return None
