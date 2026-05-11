def detect_anomaly(temp: float, vibration: float) -> str:
    if temp > 80:
        return "OVERHEATING"
    if vibration > 50:
        return "MECHANICAL FAILURE"
    return "NORMAL"
