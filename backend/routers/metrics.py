"""
metrics.py — Real-time operational KPIs and SLA metrics for the management dashboard.

Problem Statement Integration:
    - Airports need verifiable SLA compliance (target: 95%+ incidents resolved within SLA window).
    - Managers need live visibility into asset health and team performance.
    - All metrics are computed from REAL incident data (ServiceNow or SQLite fallback).

SLA Thresholds (aligned with IATA Airport Operations Standards):
    P1 (Critical / Safety): 30 minutes
    P2 (High):              2 hours
    P3 (Medium):            4 hours
    P4 (Low):               8 hours
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends
import servicenow as sn
from database import db_get_tasks, db_get_telemetry
from routers.auth import get_current_user
from routers.incidents import cleanup_snow_record

router = APIRouter()
log = logging.getLogger("metrics")

# SLA thresholds in minutes (per IATA standards)
SLA_THRESHOLDS: dict[str, int] = {
    "1": 30,    # Critical/Safety
    "2": 120,   # High
    "3": 240,   # Medium
    "4": 480,   # Low
    "5": 1440,  # Planning
}


def _compute_sla_compliance(incidents: list[dict]) -> float:
    """
    Calculate real SLA compliance rate from incident records.
    An incident is SLA-compliant if resolved within its priority's time window.
    Returns a float between 0.0 and 100.0.
    """
    if not incidents:
        return 100.0

    compliant = 0
    measurable = 0

    for inc in incidents:
        # Only measure resolved incidents
        if inc.get("state") != "6":
            continue

        priority = str(inc.get("priority", "4"))
        created_str = inc.get("sys_created_on", "")
        resolved_str = inc.get("resolved_at", inc.get("closed_at", ""))

        if not created_str or not resolved_str:
            measurable += 1  # count but assume non-compliant if no resolved_at
            continue

        try:
            # Parse datetime strings (ServiceNow format)
            fmt = "%Y-%m-%d %H:%M:%S"
            created = datetime.strptime(created_str[:19], fmt)
            resolved = datetime.strptime(resolved_str[:19], fmt)
            resolution_mins = (resolved - created).total_seconds() / 60

            threshold = SLA_THRESHOLDS.get(priority, 480)
            measurable += 1
            if resolution_mins <= threshold:
                compliant += 1
        except (ValueError, TypeError):
            measurable += 1  # malformed date = non-compliant

    if measurable == 0:
        return 100.0

    return round((compliant / measurable) * 100, 1)


def _compute_mttr(incidents: list[dict]) -> float:
    """
    Compute Mean Time to Resolution (MTTR) in hours from resolved incidents.
    """
    resolution_times = []
    for inc in incidents:
        if inc.get("state") != "6":
            continue
        created_str = inc.get("sys_created_on", "")
        resolved_str = inc.get("resolved_at", inc.get("closed_at", ""))
        if not created_str or not resolved_str:
            continue
        try:
            fmt = "%Y-%m-%d %H:%M:%S"
            created = datetime.strptime(created_str[:19], fmt)
            resolved = datetime.strptime(resolved_str[:19], fmt)
            hours = (resolved - created).total_seconds() / 3600
            resolution_times.append(hours)
        except (ValueError, TypeError):
            continue

    if not resolution_times:
        return 0.0
    return round(sum(resolution_times) / len(resolution_times), 2)


def _build_team_metrics(incidents: list[dict]) -> dict[str, Any]:
    """Break down incident counts by assigned team."""
    teams: dict[str, dict] = {}
    for inc in incidents:
        team = inc.get("u_department", inc.get("assigned_to", "Unassigned"))
        if not team:
            team = "Unassigned"
        if team not in teams:
            teams[team] = {"total": 0, "resolved": 0, "open": 0}
        teams[team]["total"] += 1
        if inc.get("state") == "6":
            teams[team]["resolved"] += 1
        else:
            teams[team]["open"] += 1
    return teams


@router.get("/")
async def get_system_metrics(user: dict = Depends(get_current_user)):
    """
    **GET /api/v1/metrics/**

    Returns real-time operational KPIs computed from live incident data:
    - SLA compliance rate (calculated against IATA priority thresholds)
    - Mean Time to Resolution (MTTR)
    - Team-level breakdown
    - Preventive task health
    - Airport-wide status derived from real data
    """
    # ── Fetch live incidents ──────────────────────────────────────────────────
    incidents_res = await sn.get_incidents(limit=200)
    incidents = incidents_res.get("result", [])
    if isinstance(incidents, list):
        incidents = [cleanup_snow_record(i) for i in incidents]
    else:
        incidents = []
        log.warning("ServiceNow incidents unavailable, metrics will reflect zero incidents.")

    # ── Fetch preventive tasks from fallback DB ──────────────────────────────
    preventive_tasks = db_get_tasks()
    overdue_tasks = [
        t for t in preventive_tasks
        if t.get("u_status") == "scheduled" and t.get("u_due_date", "9999") < datetime.now().isoformat()
    ]

    # ── Compute real KPIs ────────────────────────────────────────────────────
    total = len(incidents)
    resolved = len([i for i in incidents if i.get("state") == "6"])
    active = len([i for i in incidents if i.get("state") in ["1", "2", "3"]])
    critical = len([i for i in incidents if i.get("priority") == "1"])
    safety_risks = len([i for i in incidents if i.get("u_safety_risk") == "true"])
    iot_auto = len([i for i in incidents if i.get("u_reported_via") == "IoT_Sensor"])

    sla_compliance = _compute_sla_compliance(incidents)
    mttr_hours = _compute_mttr(incidents)
    team_breakdown = _build_team_metrics(incidents)

    # ── Derive airport health from real data ─────────────────────────────────
    def zone_status(zone_incidents: int, critical_count: int) -> str:
        if critical_count > 0:
            return "Red"
        if zone_incidents > 5:
            return "Yellow"
        return "Green"

    terminal_1 = [i for i in incidents if "terminal 1" in (i.get("location") or "").lower() or "T1" in (i.get("location") or "")]
    terminal_2 = [i for i in incidents if "terminal 2" in (i.get("location") or "").lower() or "T2" in (i.get("location") or "")]
    airside = [i for i in incidents if "airside" in (i.get("location") or "").lower() or "runway" in (i.get("location") or "").lower()]

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "system_status": "Degraded" if critical > 0 else "Operational",
        "metrics": {
            "total_incidents": total,
            "resolved_incidents": resolved,
            "active_incidents": active,
            "critical_incidents": critical,
            "safety_risk_incidents": safety_risks,
            "iot_auto_created": iot_auto,
            "sla_compliance_rate": f"{sla_compliance}%",
            "mean_time_to_resolution_hrs": mttr_hours,
            "preventive_tasks_total": len(preventive_tasks),
            "preventive_tasks_overdue": len(overdue_tasks),
        },
        "team_breakdown": team_breakdown,
        "airport_health": {
            "terminal_1": zone_status(len(terminal_1), len([i for i in terminal_1 if i.get("priority") == "1"])),
            "terminal_2": zone_status(len(terminal_2), len([i for i in terminal_2 if i.get("priority") == "1"])),
            "airside_runway": zone_status(len(airside), len([i for i in airside if i.get("priority") == "1"])),
        },
    }
