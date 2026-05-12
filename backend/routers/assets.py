"""
assets.py — Airport asset (CMDB CI) management router.

Maps to the ServiceNow Custom Table: u_airport_asset
Supports multi-tenant airport isolation via airport_id.
Falls back to SQLite when ServiceNow is unreachable.
"""

from __future__ import annotations
from typing import Optional

import database as db
import servicenow as sn
from fastapi import APIRouter, Depends, HTTPException, status, Query
from routers.auth import get_current_user
from security.rbac import RoleChecker
from pydantic import BaseModel, Field
from logger.audit import log_audit

router = APIRouter()


class AssetCreate(BaseModel):
    """Payload to register a new airport infrastructure asset (CMDB CI)."""
    name: str = Field(..., min_length=2, max_length=200, description="Descriptive asset name, e.g. 'Elevator T1-A'")
    asset_type: str = Field(..., description="Category: HVAC | Elevator | Baggage Conveyor | Runway Lighting | etc.")
    location: str = Field(..., description="Physical area, e.g. 'Gate 5'")
    area: str = Field(..., description="Terminal/zone, e.g. 'Terminal 1'")
    status: str = Field(default="operational", description="Operational status")
    criticality: str = Field(default="Medium", description="Impact level: Critical | High | Medium | Low")
    airport_id: str = Field(default="SJC-01", description="Multi-tenant airport ID")
    last_maintenance: Optional[str] = Field(default="", description="ISO date of last serviced")


class AssetUpdate(BaseModel):
    """Partial update payload for an existing asset."""
    status: Optional[str] = Field(default=None, description="New operational status")
    last_maintenance: Optional[str] = Field(default=None, description="Updated maintenance date")
    notes: Optional[str] = Field(default=None, description="Technician notes")
    criticality: Optional[str] = Field(default=None, description="Updated criticality level")


@router.get("/")
async def list_assets(
    airport_id: str = Query(default="SJC-01", description="Filter by airport ID"),
    user: dict = Depends(get_current_user)
):
    """List all CMDB assets. Falls back to local SQLite if ServiceNow is unreachable."""
    res = await sn.get_assets()
    if "error" in res:
        return {"result": db.db_get_assets(airport_id=airport_id), "source": "fallback_db"}
    return res


@router.get("/{sys_id}")
async def get_asset(sys_id: str, user: dict = Depends(get_current_user)):
    res = await sn.get_asset(sys_id)
    if "error" in res:
        asset = db.db_get_asset(sys_id)
        return {"result": asset, "source": "fallback_db"}
    return res


@router.post("/")
async def create_asset(data: AssetCreate, user: dict = Depends(RoleChecker(["admin", "manager"]))):
    """Register a new CMDB asset. Writes to ServiceNow or falls back to SQLite."""
    payload = {
        "u_name": data.name,
        "u_type": data.asset_type,
        "u_location": data.location,
        "u_terminal": data.area,
        "u_status": data.status,
        "u_criticality": data.criticality,
        "u_airport_id": data.airport_id,
        "u_last_serviced": data.last_maintenance or "",
    }
    res = await sn.create_asset(payload)
    if "error" in res:
        created = db.db_create_asset(payload)
        log_audit(user["username"], "CREATE_ASSET_FALLBACK", f"Name: {data.name} | Airport: {data.airport_id}")
        return {"result": created, "source": "fallback_db"}

    log_audit(user["username"], "CREATE_ASSET", f"Name: {data.name} | Airport: {data.airport_id}")
    return res


@router.patch("/{sys_id}")
async def update_asset(sys_id: str, update: AssetUpdate, user: dict = Depends(get_current_user)):
    """Partially update a CMDB asset record."""
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    res = await sn.update_asset(sys_id, data)
    if "error" in res:
        updated = db.db_update_asset(sys_id, data)
        log_audit(user["username"], "UPDATE_ASSET_FALLBACK", f"SysID: {sys_id}")
        return {"result": updated, "source": "fallback_db"}

    log_audit(user["username"], "UPDATE_ASSET", f"SysID: {sys_id}")
    return res
