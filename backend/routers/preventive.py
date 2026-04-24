from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import servicenow as sn

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

# Fallback in-memory DB
mock_tasks = [
    {
        "sys_id": "mock_prev_1",
        "u_title": "Monthly Elevator Inspection",
        "u_asset_name": "Elevator T1-A",
        "u_assigned_team": "Facilities Team",
        "u_due_date": "2026-05-01 00:00:00",
        "u_frequency": "Monthly",
        "u_description": "Check cables and door sensors.",
        "u_status": "scheduled"
    }
]

@router.get("/")
def list_preventive():
    res = sn.get_preventive_tasks()
    if "error" in res:
        return {"result": mock_tasks}
    return res

@router.post("/")
def create_preventive(data: PreventiveCreate):
    payload = {
        "u_title": data.title,
        "u_asset_name": data.asset_id,
        "u_assigned_team": data.assigned_team,
        "u_due_date": data.due_date,
        "u_frequency": data.frequency,
        "u_description": data.description,
        "u_status": "scheduled"
    }
    res = sn.create_preventive_task(payload)
    if "error" in res:
        import uuid
        payload["sys_id"] = str(uuid.uuid4())
        mock_tasks.append(payload)
        return {"result": payload}
    return res

@router.patch("/{sys_id}")
def update_preventive(sys_id: str, update: PreventiveUpdate):
    data = {k: v for k, v in update.dict().items() if v}
    res = sn.update_preventive_task(sys_id, data)
    if "error" in res:
        task = next((t for t in mock_tasks if t["sys_id"] == sys_id), None)
        if task:
            task.update(data)
            return {"result": task}
    return res