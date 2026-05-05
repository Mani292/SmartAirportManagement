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

        # Step 2 — Build ServiceNow payload using ONLY standard incident fields
        # Custom fields (u_department, u_area, etc.) may not exist in the instance
        # and can trigger Business Rules. Store metadata in description/work_notes.
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
            f"📞 Reporter Phone: {data.reporter_phone or 'N/A'}\n"
            f"📧 Reporter Email: {data.reporter_email or 'N/A'}"
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
        }

        # Step 3 — Create in ServiceNow
        result = sn.create_incident(payload)

        # Handle failure
        if result.get("status") == "failure" or "error" in result:
            err_detail = result.get("error", {}).get("detail", str(result))
            raise Exception(f"ServiceNow error: {err_detail}")

        inc_number = result.get("result", {}).get("number", "INC-PENDING")
        inc_sys_id = result.get("result", {}).get("sys_id", "")

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
            "incident_number": inc_number,
            "incident_sys_id": inc_sys_id,
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