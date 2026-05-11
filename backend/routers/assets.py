from typing import Optional

import database as db
import servicenow as sn
from fastapi import APIRouter, Depends
from routers.auth import get_current_user
from security.rbac import RoleChecker
from pydantic import BaseModel

router = APIRouter()


class AssetCreate(BaseModel):
    name: str
    asset_type: str
    location: str
    area: str
    status: str = "Good"
    last_maintenance: Optional[str] = ""


class AssetUpdate(BaseModel):
    status: Optional[str] = ""
    last_maintenance: Optional[str] = ""
    notes: Optional[str] = ""


@router.get("/")
def list_assets(user: dict = Depends(get_current_user)):
    res = sn.get_assets()
    if "error" in res:
        return {"result": db.db_get_assets(), "source": "fallback_db"}
    return res


@router.get("/{sys_id}")
def get_asset(sys_id: str, user: dict = Depends(get_current_user)):
    res = sn.get_asset(sys_id)
    if "error" in res:
        asset = db.db_get_asset(sys_id)
        return {"result": asset, "source": "fallback_db"}
    return res


@router.post("/")
def create_asset(data: AssetCreate, user: dict = Depends(RoleChecker(["admin", "manager"]))):
    payload = {
        "u_name": data.name,
        "u_type": data.asset_type,
        "u_location": data.location,
        "u_terminal": data.area,
        "u_status": data.status,
        "u_last_serviced": data.last_maintenance or "",
    }
    res = sn.create_asset(payload)
    if "error" in res:
        created = db.db_create_asset(payload)
        return {"result": created, "source": "fallback_db"}
    return res


@router.patch("/{sys_id}")
def update_asset(sys_id: str, update: AssetUpdate, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in update.model_dump().items() if v}
    res = sn.update_asset(sys_id, data)
    if "error" in res:
        updated = db.db_update_asset(sys_id, data)
        return {"result": updated, "source": "fallback_db"}
    return res
