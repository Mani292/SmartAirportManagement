from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import servicenow as sn
import llm
from whatsapp import send_confirmation, send_resolution
from email_service import send_task_assignment

router = APIRouter()

class IncidentCreate(BaseModel):
    short_description: str
    location: str
    area: str
    department: str = "Facilities"
    reported_via: str = "App"
    reporter_phone: Optional[str] = ""
    reporter_email: Optional[str] = ""

class IncidentUpdate(BaseModel):
    state: Optional[str] = ""
    work_notes: Optional[str] = ""
    close_notes: Optional[str] = ""

class RatingUpdate(BaseModel):
    rating: int
    comment: Optional[str] = ""

def cleanup_snow_record(record):
    if not isinstance(record, dict): return record
    for k, v in record.items():
        if isinstance(v, dict) and "value" in v:
            record[k] = v.get("display_value", v.get("value", ""))
    return record

@router.get("/")
def list_incidents(limit: int = 50, department: str = ""):
    query = f"u_department={department}" if department else ""
    res = sn.get_incidents(limit=limit, query=query)
    if "result" in res and isinstance(res["result"], list):
        res["result"] = [cleanup_snow_record(r) for r in res["result"]]
    return res

@router.get("/track/{number}")
def track_incident(number: str):
    res = sn.get_incident_by_number(number)
    if "result" in res and isinstance(res["result"], list):
        res["result"] = [cleanup_snow_record(r) for r in res["result"]]
    return res

@router.get("/{sys_id}")
def get_incident(sys_id: str):
    res = sn.get_incident(sys_id)
    if "result" in res and isinstance(res["result"], dict):
        res["result"] = cleanup_snow_record(res["result"])
    return res

@router.post("/")
def create_incident(data: IncidentCreate):
    try:
        # Step 1 — AI Triage
        triage = llm.triage_incident(
            data.short_description,
            data.location,
            data.area,
            data.department
        )

        # Step 2 — Build ServiceNow payload
        payload = {
            "short_description": data.short_description,
            "priority": triage["priority"],
            "category": triage["category"],
            "location": data.location,
            "u_area": data.area,
            "u_department": data.department,
            "u_ai_category": triage["category"],
            "u_reported_via": data.reported_via,
            "u_safety_risk": str(triage["safety_risk"]),
            "u_estimated_fix_mins": str(triage["estimated_fix_mins"]),
            "u_recommended_action": triage["recommended_action"],
            "assignment_group": triage["assigned_team"],
            "u_reporter_phone": data.reporter_phone,
        }

        # Step 3 — Create in ServiceNow
        result = sn.create_incident(payload)
        inc_number = result.get("result", {}).get("number", "")

        whatsapp_sent = False
        email_sent = False

        # Step 4 — WhatsApp confirmation to passenger
        if data.reporter_phone:
            try:
                whatsapp_sent = send_confirmation(
                    data.reporter_phone,
                    inc_number,
                    data.short_description
                )
            except Exception as wa_err:
                print(f"[WARN] WhatsApp send failed: {wa_err}")

        # Step 5 — Email task assignment notification
        if data.reporter_email:
            try:
                email_sent = send_task_assignment(
                    data.reporter_email,
                    inc_number,
                    data.short_description,
                    f"{data.location} — {data.area}",
                    str(triage["priority"]),
                    triage["recommended_action"]
                )
            except Exception as email_err:
                print(f"[WARN] Email send failed: {email_err}")

        return {
            "success": True,
            "incident": result,
            "ai_triage": triage,
            "notifications": {
                "whatsapp_sent": whatsapp_sent,
                "email_sent": email_sent
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{sys_id}")
def update_incident(sys_id: str, update: IncidentUpdate):
    data = {k: v for k, v in update.dict().items() if v}

    # If resolved — send WhatsApp + email to passenger
    if update.state == "6":
        try:
            incident = sn.get_incident(sys_id)
            phone = incident.get("result", {}).get("u_reporter_phone", "")
            number = incident.get("result", {}).get("number", "")
            if phone:
                try:
                    send_resolution(phone, number)
                except Exception as wa_err:
                    print(f"[WARN] WhatsApp resolution send failed: {wa_err}")
        except Exception as lookup_err:
            print(f"[WARN] Could not fetch incident for notification: {lookup_err}")

    return sn.update_incident(sys_id, data)

@router.post("/{sys_id}/rate")
def rate_incident(sys_id: str, rating: RatingUpdate):
    data = {
        "u_passenger_rating": str(rating.rating),
        "u_rating_comment": rating.comment
    }
    return sn.update_incident(sys_id, data)