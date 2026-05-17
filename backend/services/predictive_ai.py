def predict_failure(asset: dict) -> dict:
    score = 0
    if asset.get("temperature", 0) > 80:
        score += 40
    if asset.get("vibration", 0) > 50:
        score += 30
    if asset.get("failure_history", 0) > 3:
        score += 30

    if score >= 70:
        return {
            "risk": "HIGH",
            "action": "Immediate maintenance required"
        }
    return {
        "risk": "LOW"
    }
