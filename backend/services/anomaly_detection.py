"""
anomaly_detection.py — Statistical anomaly detection engine for IoT sensor data.

Algorithm Hierarchy:
    1. Hard safety thresholds (instant CRITICAL_FAILURE_IMMINENT)
    2. Z-Score statistical analysis (requires ≥5 historical readings)
    3. Dynamic soft thresholds (fallback for cold-start / sparse data)

Returns a structured AnomalyResult dict instead of raw strings
to ensure type-safe consumption by callers.
"""

from __future__ import annotations
import statistics
from typing import TypedDict


class AnomalyResult(TypedDict):
    """Structured result from detect_anomaly(). None = no anomaly detected."""
    anomaly_type: str       # e.g. "OVERHEATING", "VIBRATION_ANOMALY"
    severity: str           # "CRITICAL" | "HIGH" | "MEDIUM"
    z_score: float | None   # Z-score if statistical method was used, else None
    message: str            # Human-readable description for incident creation


# Per-asset-type temperature thresholds (°C)
ASSET_THRESHOLDS: dict[str, dict] = {
    "hvac":      {"temp_warn": 70, "temp_crit": 90, "vib_warn": 30, "vib_crit": 60},
    "elevator":  {"temp_warn": 75, "temp_crit": 95, "vib_warn": 40, "vib_crit": 70},
    "baggage":   {"temp_warn": 80, "temp_crit": 100, "vib_warn": 55, "vib_crit": 85},
    "runway":    {"temp_warn": 65, "temp_crit": 85, "vib_warn": 20, "vib_crit": 50},
    "default":   {"temp_warn": 85, "temp_crit": 100, "vib_warn": 60, "vib_crit": 90},
}


def detect_anomaly(
    temperature: float,
    vibration: float,
    history: list[dict] | None = None,
    asset_type: str = "default",
    humidity: float | None = None,
) -> AnomalyResult | None:
    """
    Detect anomalies in IoT sensor readings.

    Args:
        temperature: Current temperature reading (°C).
        vibration: Current vibration reading (Hz).
        history: List of recent telemetry dicts (must have 'temperature'/'vibration' keys).
        asset_type: Asset category for context-aware thresholds.
        humidity: Optional humidity reading (%) — used for compounding HIGH_WEAR_RISK.

    Returns:
        AnomalyResult dict if anomaly detected, None otherwise.
    """
    thresholds = ASSET_THRESHOLDS.get(asset_type.lower(), ASSET_THRESHOLDS["default"])

    # ── Stage 1: Hard Safety Thresholds ─────────────────────────────────────
    if temperature >= thresholds["temp_crit"] or vibration >= thresholds["vib_crit"]:
        return AnomalyResult(
            anomaly_type="CRITICAL_FAILURE_IMMINENT",
            severity="CRITICAL",
            z_score=None,
            message=(
                f"Asset entering failure zone: temp={temperature}°C, vib={vibration}Hz. "
                "Immediate shutdown recommended."
            ),
        )

    # ── Stage 2: Z-Score Statistical Analysis ─────────────────────────────
    if history and len(history) >= 5:
        temp_history = [h.get("temperature", 0) for h in history if h.get("temperature") is not None]
        vib_history  = [h.get("vibration", 0)  for h in history if h.get("vibration")  is not None]

        try:
            if len(temp_history) >= 5:
                t_mean = statistics.mean(temp_history)
                t_std  = statistics.stdev(temp_history)
                if t_std > 0:
                    z_temp = (temperature - t_mean) / t_std
                    if z_temp > 3.0:
                        return AnomalyResult(
                            anomaly_type="THERMAL_ANOMALY",
                            severity="HIGH",
                            z_score=round(z_temp, 2),
                            message=f"Temperature {temperature}°C is {round(z_temp, 2)}σ above historical mean ({round(t_mean, 1)}°C).",
                        )

            if len(vib_history) >= 5:
                v_mean = statistics.mean(vib_history)
                v_std  = statistics.stdev(vib_history)
                if v_std > 0:
                    z_vib = (vibration - v_mean) / v_std
                    if z_vib > 3.0:
                        return AnomalyResult(
                            anomaly_type="VIBRATION_ANOMALY",
                            severity="HIGH",
                            z_score=round(z_vib, 2),
                            message=f"Vibration {vibration}Hz is {round(z_vib, 2)}σ above historical mean ({round(v_mean, 1)}Hz).",
                        )

        except statistics.StatisticsError:
            pass  # Not enough variance in data — fall through to soft thresholds

    # ── Stage 3: Dynamic Soft Thresholds ──────────────────────────────────
    if temperature > thresholds["temp_warn"]:
        return AnomalyResult(
            anomaly_type="OVERHEATING",
            severity="HIGH",
            z_score=None,
            message=f"Temperature {temperature}°C exceeds warning threshold of {thresholds['temp_warn']}°C.",
        )

    if vibration > thresholds["vib_warn"]:
        return AnomalyResult(
            anomaly_type="EXCESSIVE_VIBRATION",
            severity="MEDIUM",
            z_score=None,
            message=f"Vibration {vibration}Hz exceeds warning threshold of {thresholds['vib_warn']}Hz.",
        )

    # Compound: high temp + high vibration + high humidity = accelerated wear
    if (
        temperature > thresholds["temp_warn"] * 0.85
        and vibration > thresholds["vib_warn"] * 0.65
        and (humidity is not None and humidity > 75)
    ):
        return AnomalyResult(
            anomaly_type="HIGH_WEAR_RISK",
            severity="MEDIUM",
            z_score=None,
            message=f"Combined high temp ({temperature}°C), vibration ({vibration}Hz), and humidity ({humidity}%) indicate accelerated wear.",
        )

    return None
