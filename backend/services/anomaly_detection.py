import statistics

def detect_anomaly(temperature: float, vibration: float, history: list[dict] = None) -> str | None:
    """
    Advanced statistical anomaly detection.
    Uses Z-score analysis if history is available, falling back to 
    dynamic thresholding for cold starts.
    """
    # 1. Base Thresholds (Safety Nets)
    if temperature > 100 or vibration > 90:
        return "CRITICAL_FAILURE_IMMINENT"

    # 2. Statistical Analysis (if history exists)
    if history and len(history) >= 5:
        temp_history = [h.get("temperature", 0) for h in history]
        vib_history = [h.get("vibration", 0) for h in history]
        
        try:
            # Calculate Mean and Std Dev
            t_mean = statistics.mean(temp_history)
            t_std = statistics.stdev(temp_history)
            v_mean = statistics.mean(vib_history)
            v_std = statistics.stdev(vib_history)
            
            # Z-Score Detection (Threshold: 3.0 standard deviations)
            # If current value is > 3 sigma from mean, it's a statistical anomaly
            if t_std > 0 and (temperature - t_mean) / t_std > 3.0:
                return f"THERMAL_ANOMALY (Z={round((temperature-t_mean)/t_std, 2)})"
            
            if v_std > 0 and (vibration - v_mean) / v_std > 3.0:
                return f"VIBRATION_ANOMALY (Z={round((vibration-v_mean)/v_std, 2)})"
                
        except statistics.StatisticsError:
            pass # Not enough variation in data yet

    # 3. Dynamic Thresholding (Fallback)
    if temperature > 85:
        return "OVERHEATING"
    if vibration > 60:
        return "EXCESSIVE_VIBRATION"
    if temperature > 75 and vibration > 40:
        return "HIGH_WEAR_RISK"

    return None
