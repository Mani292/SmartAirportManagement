"""
shifts.py — Staff shift management and AI-powered handover summaries.
"""

from __future__ import annotations
from datetime import date
from typing import Optional

import database as db
import servicenow as sn
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, Field
from routers.auth import get_current_user
from security.rbac import RoleChecker
from logger.audit import log_audit
import llm

router = APIRouter()


class ShiftCreate(BaseModel):
    staff_username: str
    role: str
    shift_date: str = Field(default_factory=lambda: date.today().isoformat())
    start_time: str
    end_time: str
    terminal: str = ""
    airport_id: str = "SJC-01"


class ShiftHandoverUpdate(BaseModel):
    handover_notes: str = ""
    generate_ai_summary: bool = True


@router.get("/")
async def list_shifts(
    airport_id: str = Query(default="SJC-01"),
    shift_date: str = Query(default=""),
    user: dict = Depends(get_current_user),
):
    """Return the shift roster. Optionally filter by date."""
    if not shift_date:
        shift_date = date.today().isoformat()
    shifts = db.db_get_shifts(airport_id=airport_id, shift_date=shift_date)
    return {"result": shifts, "total": len(shifts), "date": shift_date}


@router.get("/today")
async def get_today_roster(
    airport_id: str = Query(default="SJC-01"),
    user: dict = Depends(get_current_user),
):
    """Return today's active staff roster for operations command center."""
    today = date.today().isoformat()
    shifts = db.db_get_shifts(airport_id=airport_id, shift_date=today)
    active = [s for s in shifts if s.get("status") in ("active", "scheduled")]
    return {
        "date": today,
        "total_staff": len(active),
        "shifts": active,
        "coverage": {
            "terminals": list({s.get("terminal", "") for s in active}),
            "roles": list({s.get("role", "") for s in active}),
        }
    }


@router.post("/")
async def create_shift(
    data: ShiftCreate,
    user: dict = Depends(RoleChecker(["admin", "manager"])),
):
    """Create a new shift assignment."""
    shift = db.db_create_shift({
        "u_airport_id": data.airport_id,
        "staff_username": data.staff_username,
        "role": data.role,
        "shift_date": data.shift_date,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "terminal": data.terminal,
        "status": "scheduled",
    })
    log_audit(user["username"], "CREATE_SHIFT", f"Staff: {data.staff_username} | Date: {data.shift_date}")
    return {"success": True, "result": shift}


@router.post("/{sys_id}/handover")
async def submit_handover(
    sys_id: str,
    data: ShiftHandoverUpdate,
    user: dict = Depends(get_current_user),
):
    """
    Submit end-of-shift handover notes. If generate_ai_summary=True,
    Groq AI generates a professional handover summary from today's incidents.
    """
    # Fetch today's incidents for context
    try:
        incidents_res = await sn.get_incidents(limit=50)
        incidents = incidents_res.get("result", [])
        if not isinstance(incidents, list):
            incidents = []
    except Exception:
        incidents = []

    # Fetch open work orders
    wo_list = db.db_get_work_orders(status="open") + db.db_get_work_orders(status="in_progress")

    ai_summary = ""
    if data.generate_ai_summary:
        try:
            ai_summary = await llm.generate_shift_handover_summary(incidents, wo_list, data.handover_notes)
        except Exception as e:
            ai_summary = f"AI summary unavailable: {str(e)}"

    updated = db.db_update_shift(sys_id, {
        "status": "completed",
        "handover_notes": data.handover_notes,
        "ai_summary": ai_summary,
    })
    log_audit(user["username"], "SHIFT_HANDOVER", f"Shift: {sys_id} | AI Summary generated: {bool(ai_summary)}")
    return {
        "success": True,
        "result": updated,
        "ai_summary": ai_summary,
    }
