def detect_anomaly(temperature: float, vibration: float) -> str | None:
    """
    Predictive AI logic to detect anomalies in airport asset sensors.
    Returns the type of anomaly if detected, else None.
    """
    # Simple threshold-based anomaly detection (can be expanded to ML model)
    if temperature > 85:
        return "OVERHEATING"
    
    if vibration > 60:
        return "EXCESSIVE_VIBRATION"
    
    # Combined risk factor
    if temperature > 75 and vibration > 40:
        return "HIGH_WEAR_RISK"
    
    return None
