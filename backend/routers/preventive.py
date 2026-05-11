from typing import Optional

import database as db
import servicenow as sn
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from routers.auth import get_current_user
from security.rbac import require_role

router = APIRouter()


class PreventiveCreate(BaseModel):
    title: str
    asset_id: str
    assigned_team: str
    due_date: str
    frequency: str = "Monthly"
    description: Optional[str] = ""


class PreventiveUpdate(BaseModel):
    state: Optional[str] = ""
    notes: Optional[str] = ""
    completed_date: Optional[str] = ""


@router.get("/")
def list_preventive(user=Depends(get_current_user)):
    res = sn.get_preventive_tasks()
    if "error" in res:
        return {"result": db.db_get_tasks(), "source": "fallback_db"}
    return res


@router.post("/")
def create_preventive(data: PreventiveCreate, user=Depends(get_current_user)):
    require_role(user, ["admin", "manager"])
    payload = {
        "u_title": data.title,
        "u_asset_name": data.asset_id,
        "u_assigned_team": data.assigned_team,
        "u_due_date": data.due_date,
        "u_frequency": data.frequency,
        "u_description": data.description or "",
        "u_status": "scheduled",
    }
    res = sn.create_preventive_task(payload)
    if "error" in res:
        created = db.db_create_task(payload)
        return {"result": created, "source": "fallback_db"}
    return res


@router.patch("/{sys_id}")
def update_preventive(sys_id: str, update: PreventiveUpdate, user=Depends(get_current_user)):
    require_role(user, ["admin", "manager", "technician", "electrician", "plumber", "security", "helpstaff"])
    data = {k: v for k, v in update.model_dump().items() if v}
    res = sn.update_preventive_task(sys_id, data)
    if "error" in res:
        updated = db.db_update_task(sys_id, data)
        return {"result": updated, "source": "fallback_db"}
    return res
