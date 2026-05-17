"""
workorders.py — Work Order management router with full approval workflow.

Workflow: open → in_progress → pending_approval → approved → closed
         or: open → in_progress → pending_approval → rejected → open

ServiceNow Integration: Syncs to wm_order table.
"""

from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional

import database as db
import servicenow as sn
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from routers.auth import get_current_user
from security.rbac import RoleChecker
from logger.audit import log_audit

router = APIRouter()

SLA_MINUTES = {"1": 30, "2": 120, "3": 240, "4": 480, "5": 1440}


# ── Pydantic Models ────────────────────────────────────────────────────────────

class WorkOrderCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=300)
    description: str = Field(default="")
    linked_incident_id: str = Field(default="", description="Local incident sys_id")
    sn_incident_sys_id: str = Field(default="", description="ServiceNow incident sys_id")
    assigned_team: str = Field(..., description="Team: Electrical | Plumbing | Security | Facilities | IT | HR")
    assigned_to: str = Field(default="", description="Specific staff username")
    priority: str = Field(default="3", description="1=Critical, 2=High, 3=Medium, 4=Low")
    asset_id: str = Field(default="")
    location: str = Field(default="")
    requires_approval: bool = Field(default=True)
    airport_id: str = Field(default="SJC-01")


class WorkOrderUpdate(BaseModel):
    status: Optional[str] = None
    technician_notes: Optional[str] = None
    assigned_to: Optional[str] = None


class ApprovalAction(BaseModel):
    action: str = Field(..., description="approve | reject")
    notes: str = Field(default="")


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/")
async def list_work_orders(
    airport_id: str = Query(default="SJC-01"),
    status: str = Query(default=""),
    assigned_to: str = Query(default=""),
    user: dict = Depends(get_current_user),
):
    """List work orders. Technicians see only their own; managers see all."""
    effective_assignee = assigned_to
    if user["role"] in ("technician", "electrician", "plumber", "security", "helpstaff"):
        effective_assignee = user["username"]

    orders = db.db_get_work_orders(
        airport_id=airport_id,
        status=status,
        assigned_to=effective_assignee,
    )
    return {"result": orders, "total": len(orders)}


@router.get("/{sys_id}")
async def get_work_order(sys_id: str, user: dict = Depends(get_current_user)):
    wo = db.db_get_work_order(sys_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return {"result": wo}


@router.post("/")
async def create_work_order(
    data: WorkOrderCreate,
    user: dict = Depends(RoleChecker(["admin", "manager", "supervisor"])),
):
    """Create a work order and sync to ServiceNow wm_order."""
    sla_mins = SLA_MINUTES.get(data.priority, 240)
    sla_target = (datetime.now() + timedelta(minutes=sla_mins)).isoformat()

    payload = {
        "u_airport_id": data.airport_id,
        "title": data.title,
        "description": data.description,
        "linked_incident_id": data.linked_incident_id,
        "sn_incident_sys_id": data.sn_incident_sys_id,
        "assigned_team": data.assigned_team,
        "assigned_to": data.assigned_to,
        "priority": data.priority,
        "status": "open",
        "approval_status": "pending" if data.requires_approval else "not_required",
        "asset_id": data.asset_id,
        "location": data.location,
        "sla_target": sla_target,
        "created_by": user["username"],
    }

    # Sync to ServiceNow wm_order
    sn_payload = {
        "short_description": data.title,
        "description": data.description,
        "priority": data.priority,
        "u_linked_incident": data.sn_incident_sys_id,
        "assignment_group": data.assigned_team,
        "location": data.location,
    }
    sn_res = await sn.create_work_order(sn_payload)
    if "result" in sn_res:
        payload["sn_work_order_sys_id"] = sn_res["result"].get("sys_id", "")

    wo = db.db_create_work_order(payload)
    log_audit(user["username"], "CREATE_WORK_ORDER", f"WO: {wo.get('sys_id')} | Team: {data.assigned_team}")
    return {"success": True, "result": wo}


@router.patch("/{sys_id}")
async def update_work_order(
    sys_id: str,
    update: WorkOrderUpdate,
    user: dict = Depends(get_current_user),
):
    """Technician updates status/notes on a work order."""
    wo = db.db_get_work_order(sys_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    updates: dict = {}
    if update.status:
        # State machine validation
        valid_transitions = {
            "open": ["in_progress"],
            "in_progress": ["pending_approval", "open"],
            "pending_approval": [],  # Only supervisors can change via /approve
            "approved": ["closed"],
            "rejected": ["in_progress"],
            "closed": [],
        }
        current = wo.get("status", "open")
        if update.status not in valid_transitions.get(current, []):
            # Supervisors/admins can force transitions
            if user["role"] not in ("admin", "manager"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid transition: {current} → {update.status}"
                )
        updates["status"] = update.status
        if update.status == "closed":
            updates["closed_at"] = datetime.now().isoformat()

    if update.technician_notes:
        updates["technician_notes"] = update.technician_notes
    if update.assigned_to:
        updates["assigned_to"] = update.assigned_to

    if not updates:
        return {"result": wo}

    # Sync status to ServiceNow
    sn_sys_id = wo.get("sn_work_order_sys_id", "")
    if sn_sys_id and update.status:
        await sn.update_work_order(sn_sys_id, {"state": update.status, "work_notes": update.technician_notes or ""})

    updated = db.db_update_work_order(sys_id, updates)
    log_audit(user["username"], "UPDATE_WORK_ORDER", f"WO: {sys_id} | Status: {update.status}")
    return {"success": True, "result": updated}


@router.post("/{sys_id}/approve")
async def approve_work_order(
    sys_id: str,
    action: ApprovalAction,
    user: dict = Depends(RoleChecker(["admin", "manager"])),
):
    """Supervisor approves or rejects a pending work order."""
    wo = db.db_get_work_order(sys_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    if wo.get("approval_status") not in ("pending", "not_required"):
        raise HTTPException(status_code=400, detail="Work order is not pending approval")
    if action.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    updates = {
        "approval_status": "approved" if action.action == "approve" else "rejected",
        "approved_by": user["username"],
        "approval_notes": action.notes,
        "status": "approved" if action.action == "approve" else "rejected",
    }
    updated = db.db_update_work_order(sys_id, updates)
    log_audit(user["username"], f"WORK_ORDER_{action.action.upper()}", f"WO: {sys_id} | Notes: {action.notes}")
    return {"success": True, "result": updated}


@router.get("/{sys_id}/history")
async def get_work_order_history(sys_id: str, user: dict = Depends(get_current_user)):
    """Return audit trail for a specific work order."""
    logs = db.db_get_audit_logs(action=sys_id[:8], limit=50)
    wo = db.db_get_work_order(sys_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return {"result": wo, "audit_trail": logs}
