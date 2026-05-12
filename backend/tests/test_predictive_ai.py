from services.predictive_ai import predict_failure

def test_predict_failure_high_risk():
    asset = {"temperature": 85.0, "vibration": 55.0, "failure_history": 2}
    result = predict_failure(asset)
    assert result["risk"] == "HIGH"

def test_predict_failure_low_risk():
    asset = {"temperature": 75.0, "vibration": 40.0, "failure_history": 1}
    result = predict_failure(asset)
    assert result["risk"] == "LOW"
