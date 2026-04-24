from fastapi import APIRouter
from pydantic import BaseModel
from email_service import send_task_assignment, send_sla_breach, send_daily_summary

router = APIRouter()

class AssignmentData(BaseModel):
    to: str
    inc_number: str
    description: str
    location: str
    priority: str
    action: str

class SLAData(BaseModel):
    to: str
    inc_number: str
    priority: str
    elapsed_mins: int

class SummaryData(BaseModel):
    to: str
    total: int
    resolved: int
    overdue: int

@router.post("/assignment")
def notify_assignment(data: AssignmentData):
    sent = send_task_assignment(
        data.to, data.inc_number, data.description,
        data.location, data.priority, data.action
    )
    return {"sent": sent}

@router.post("/sla-breach")
def notify_sla(data: SLAData):
    sent = send_sla_breach(
        data.to, data.inc_number,
        data.priority, data.elapsed_mins
    )
    return {"sent": sent}

@router.post("/daily-summary")
def daily_summary(data: SummaryData):
    sent = send_daily_summary(
        data.to, data.total,
        data.resolved, data.overdue
    )
    return {"sent": sent}