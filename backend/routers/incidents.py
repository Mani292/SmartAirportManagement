"""
incidents.py — Airport incident lifecycle management router.

Problem Statement Integration:
    - Passengers scan QR codes → report issues via Web Portal → AI triages to correct team.
    - IoT sensors → automatic incident creation via anomaly detection.
    - Staff resolve via Mobile App → passenger notified via WhatsApp/Email.
    - All actions logged in audit trail for accountability.
"""

from __future__ import annotations
from typing import Optional

import llm
import servicenow as sn
from email_service import send_task_assignment
from fastapi import APIRouter, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from routers.auth import get_current_user
from security.rbac import RoleChecker
from pydantic import BaseModel, Field
from whatsapp import send_confirmation, send_resolution
from logger.audit import log_audit
from datetime import datetime, timedelta

router = APIRouter()


class IncidentCreate(BaseModel):
    """Payload for creating a new airport incident (from passenger, IoT, or staff)."""
    short_description: str = Field(..., min_length=5, max_length=1000, description="Brief description of the issue")
    location: str = Field(..., description="Physical location, e.g. 'Terminal 1'")
    area: str = Field(..., description="Sub-location, e.g. 'Gate A3'")
    department: str = Field(default="Facilities", description="Reporting department")
    reported_via: str = Field(default="App", description="Channel: App | QR | IoT_Sensor | WhatsApp")
    reporter_name: Optional[str] = Field(default="", description="Passenger or staff name")
    reporter_phone: Optional[str] = Field(default="", description="Phone for WhatsApp notification")
    reporter_email: Optional[str] = Field(default="", description="Email for confirmation")


class IncidentUpdate(BaseModel):
    state: Optional[str] = ""
    work_notes: Optional[str] = ""
    close_notes: Optional[str] = ""


class RatingUpdate(BaseModel):
    rating: int
    comment: Optional[str] = ""


def cleanup_snow_record(record):
    if not isinstance(record, dict):
        return record
    for k, v in record.items():
        if isinstance(v, dict) and "value" in v:
            record[k] = v.get("display_value", v.get("value", ""))
    return record


@router.get("/")
async def list_incidents(limit: int = 50, department: str = "", user: dict = Depends(get_current_user)):
    query = f"u_department={department}" if department else ""
    res = await sn.get_incidents(limit=limit, query=query)
    if "result" in res and isinstance(res["result"], list):
        res["result"] = [cleanup_snow_record(r) for r in res["result"]]
    return res


@router.get("/track/{number}")
async def track_incident(number: str):
    res = await sn.get_incident_by_number(number)
    if "result" in res and isinstance(res["result"], list):
        res["result"] = [cleanup_snow_record(r) for r in res["result"]]
    return res


@router.get("/{sys_id}")
async def get_incident(sys_id: str, user: dict = Depends(get_current_user)):
    res = await sn.get_incident(sys_id)
    if "result" in res and isinstance(res["result"], dict):
        res["result"] = cleanup_snow_record(res["result"])
    return res


@router.post("/")
async def create_incident(data: IncidentCreate):
    try:
        # Step 1 — AI Triage
        triage = await llm.triage_incident(
            data.short_description, data.location, data.area, data.department
        )

        # Step 1.5 — SLA Calculation
        priority_sla_map = {
            "1": 30,    # 30 mins
            "2": 120,   # 2 hours
            "3": 240,   # 4 hours
            "4": 480,   # 8 hours
            "5": 1440,  # 24 hours
        }
        sla_mins = priority_sla_map.get(str(triage["priority"]), 240)
        target_resolution = (datetime.now() + timedelta(minutes=sla_mins)).isoformat()

        # Step 2 — Build ServiceNow payload
        ai_notes = (
            f"🤖 AI Triage Result:\n"
            f"  Team: {triage['assigned_team']}\n"
            f"  Category: {triage['category']}\n"
            f"  Priority: P{triage['priority']}\n"
            f"  Estimated Fix: {triage['estimated_fix_mins']} mins\n"
            f"  Safety Risk: {triage['safety_risk']}\n"
            f"  Recommended Action: {triage['recommended_action']}\n\n"
            f"📍 Location: {data.location} — {data.area}\n"
            f"📱 Reported via: {data.reported_via}\n"
            f"👤 Reporter: {data.reporter_name or 'Anonymous'}\n"
            f"📞 Reporter Phone: {data.reporter_phone or 'N/A'}\n"
            f"📧 Reporter Email: {data.reporter_email or 'N/A'}\n"
            + (
                "\n🚁 DRONE DISPATCH: Autonomous drone will perform initial visual verification."
                if triage.get("assigned_team") == "Drone Fleet" else ""
            )
        )

        payload = {
            "short_description": f"[{triage['assigned_team']}] {data.short_description}",
            "description": f"Reported from: {data.location} — {data.area}\n\n{ai_notes}",
            "priority": triage["priority"],
            "category": triage["category"],
            "location": data.location,
            "work_notes": ai_notes,
            "impact": "2",
            "urgency": "2",
            "u_target_resolution": target_resolution,
            "u_sla_minutes": sla_mins,
        }

        # Step 3 — Create in ServiceNow (Async)
        result = await sn.create_incident(payload)
        
        # Log Audit
        log_audit("SYSTEM" if data.reported_via == "IoT_Sensor" else "PASSENGER", "CREATE_INCIDENT", 
                  f"Number: {result.get('result', {}).get('number')} | Priority: {triage['priority']}")

        # Handle failure
        if result.get("status") == "failure" or "error" in result:
            err_detail = result.get("error", {}).get("detail", str(result))
            raise Exception(f"ServiceNow error: {err_detail}")

        inc_number = result.get("result", {}).get("number", "INC-PENDING")
        inc_sys_id = result.get("result", {}).get("sys_id", "")

        whatsapp_sent = False
        email_sent = False

        # Step 4 — WhatsApp confirmation to passenger (Async)
        if data.reporter_phone:
            try:
                whatsapp_sent = await send_confirmation(
                    data.reporter_phone, inc_number, data.short_description
                )
            except Exception as wa_err:
                print(f"[WARN] WhatsApp send failed: {wa_err}")

        # Step 5 — Email task assignment notification (Sync wrapper)
        if data.reporter_email:
            try:
                email_sent = await run_in_threadpool(
                    send_task_assignment,
                    data.reporter_email,
                    inc_number,
                    data.short_description,
                    f"{data.location} — {data.area}",
                    str(triage["priority"]),
                    triage["recommended_action"],
                )
            except Exception as email_err:
                print(f"[WARN] Email send failed: {email_err}")

        return {
            "success": True,
            "incident_number": inc_number,
            "incident_sys_id": inc_sys_id,
            "incident": result,
            "ai_triage": triage,
            "notifications": {"whatsapp_sent": whatsapp_sent, "email_sent": email_sent},
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{sys_id}")
async def update_incident(sys_id: str, update: IncidentUpdate, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in update.dict().items() if v}

    # If resolved — send WhatsApp + email to passenger
    if update.state == "6":
        try:
            incident = await sn.get_incident(sys_id)
            phone = incident.get("result", {}).get("u_reporter_phone", "")
            number = incident.get("result", {}).get("number", "")
            if phone:
                try:
                    await send_resolution(phone, number)
                except Exception as wa_err:
                    print(f"[WARN] WhatsApp resolution send failed: {wa_err}")
            
            log_audit(user["username"], "RESOLVE_INCIDENT", f"SysID: {sys_id} | Number: {number}")
        except Exception as lookup_err:
            print(f"[WARN] Could not fetch incident for notification: {lookup_err}")

    return await sn.update_incident(sys_id, data)


@router.post("/{sys_id}/rate")
async def rate_incident(sys_id: str, rating: RatingUpdate):
    data = {
        "u_passenger_rating": str(rating.rating),
        "u_rating_comment": rating.comment,
    }
    return await sn.update_incident(sys_id, data)
