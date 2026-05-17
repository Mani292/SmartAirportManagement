"""
fids.py — Flight Information Display System (FIDS) router.

Provides live flight board data and passenger disruption guidance.
Uses local SQLite seeded data as FIDS source (real FIDS API can be
plugged in by replacing db_get_flights with an external API call).
"""

from __future__ import annotations
from typing import Optional

import database as db
import servicenow as sn
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, Field
from routers.auth import get_current_user
from logger.audit import log_audit
from whatsapp import send_confirmation

router = APIRouter()

# Status color/severity mapping
STATUS_SEVERITY = {
    "On Time": "normal",
    "Boarding": "info",
    "Departed": "normal",
    "Arrived": "normal",
    "Delayed": "warning",
    "Cancelled": "critical",
    "Diverted": "critical",
}

DISRUPTION_GUIDANCE = {
    "Cancelled": "Please proceed to the rebooking counter at your gate or contact airline customer service.",
    "Delayed": "Your flight is delayed. Please stay near your gate and watch for updates.",
    "Diverted": "Your flight has been diverted. Please contact airline staff for rebooking assistance.",
    "Weather": "Delays due to weather conditions. Please remain at the gate and await updates.",
    "Mechanical": "Technical issue under investigation. Airline staff will provide updates at the gate.",
    "ATC": "Air Traffic Control delay. Expected to clear shortly — please remain in the gate area.",
}


class DisruptionAlert(BaseModel):
    flight_sys_id: str
    disruption_type: str = Field(..., description="Weather | Mechanical | ATC | Operational | Security")
    disruption_msg: str
    new_status: str = Field(..., description="Delayed | Cancelled | Diverted")
    notify_passengers: bool = Field(default=False)
    passenger_phones: list[str] = Field(default_factory=list)


class FlightUpdate(BaseModel):
    status: Optional[str] = None
    gate: Optional[str] = None
    actual_dep: Optional[str] = None
    actual_arr: Optional[str] = None
    disruption_type: Optional[str] = None
    disruption_msg: Optional[str] = None


@router.get("/flights")
async def get_flight_board(
    airport_id: str = Query(default="SJC-01"),
    status: str = Query(default="", description="Filter: On Time | Delayed | Cancelled | Boarding"),
):
    """
    Public FIDS endpoint — no auth required for passengers.
    Returns enriched flight board with guidance messages.
    """
    flights = db.db_get_flights(airport_id=airport_id, status=status)
    enriched = []
    for f in flights:
        flight_status = f.get("status", "On Time")
        disruption_type = f.get("disruption_type", "")
        guidance = ""
        if flight_status in ("Delayed", "Cancelled", "Diverted"):
            guidance = DISRUPTION_GUIDANCE.get(disruption_type) or DISRUPTION_GUIDANCE.get(flight_status, "")
        enriched.append({
            **f,
            "severity": STATUS_SEVERITY.get(flight_status, "normal"),
            "guidance": guidance,
        })

    summary = {
        "total": len(enriched),
        "on_time": len([f for f in enriched if f["status"] == "On Time"]),
        "delayed": len([f for f in enriched if f["status"] == "Delayed"]),
        "cancelled": len([f for f in enriched if f["status"] == "Cancelled"]),
        "boarding": len([f for f in enriched if f["status"] == "Boarding"]),
    }
    return {"flights": enriched, "summary": summary}


@router.get("/flights/{sys_id}")
async def get_flight(sys_id: str):
    """Get a single flight's details."""
    flights = db.db_get_flights()
    flight = next((f for f in flights if f.get("sys_id") == sys_id), None)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    return {"result": flight}


@router.patch("/flights/{sys_id}")
async def update_flight_status(
    sys_id: str,
    update: FlightUpdate,
    user: dict = Depends(get_current_user),
):
    """Airport operations staff update a flight's status/gate."""
    updates = {k: v for k, v in update.model_dump().items() if v is not None}
    updated = db.db_update_flight(sys_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Flight not found")
    log_audit(user["username"], "UPDATE_FLIGHT", f"Flight: {sys_id} | Status: {update.status}")
    return {"success": True, "result": updated}


@router.post("/disruption")
async def create_disruption_alert(
    alert: DisruptionAlert,
    user: dict = Depends(get_current_user),
):
    """
    Create a flight disruption event:
    1. Updates flight status in FIDS DB.
    2. Auto-creates a ServiceNow incident for tracking.
    3. Optionally sends WhatsApp notifications to affected passengers.
    """
    # 1. Update flight record
    updated_flight = db.db_update_flight(alert.flight_sys_id, {
        "status": alert.new_status,
        "disruption_type": alert.disruption_type,
        "disruption_msg": alert.disruption_msg,
    })

    flight_number = updated_flight.get("flight_number", "UNKNOWN") if updated_flight else "UNKNOWN"

    # 2. Create ServiceNow incident for passenger disruption tracking
    sn_payload = {
        "short_description": f"[FIDS] Flight {flight_number} — {alert.new_status} ({alert.disruption_type})",
        "description": alert.disruption_msg,
        "category": "Passenger Services",
        "priority": "2" if alert.new_status == "Cancelled" else "3",
        "u_reported_via": "FIDS_System",
    }
    sn_res = await sn.create_incident(sn_payload)
    inc_number = sn_res.get("result", {}).get("number", "INC-PENDING")

    # 3. WhatsApp notifications (optional)
    notified = 0
    if alert.notify_passengers and alert.passenger_phones:
        guidance = DISRUPTION_GUIDANCE.get(alert.disruption_type) or DISRUPTION_GUIDANCE.get(alert.new_status, "")
        for phone in alert.passenger_phones[:50]:  # cap at 50 per call
            try:
                await send_confirmation(phone, flight_number, f"Flight {flight_number} is {alert.new_status}. {guidance}")
                notified += 1
            except Exception:
                pass

    log_audit(user["username"], "DISRUPTION_ALERT", f"Flight: {flight_number} | Status: {alert.new_status} | Notified: {notified}")
    return {
        "success": True,
        "flight_number": flight_number,
        "new_status": alert.new_status,
        "incident_number": inc_number,
        "passengers_notified": notified,
        "guidance": DISRUPTION_GUIDANCE.get(alert.disruption_type, ""),
    }
