from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import servicenow as sn

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

# Fallback in-memory DB if ServiceNow tables don't exist
mock_assets = [
    {
        "sys_id": "mock_asset_1",
        "u_name": "Elevator T1-A",
        "u_type": "Elevator",
        "u_location": "Gate 5",
        "u_terminal": "Terminal 1",
        "u_status": "operational",
        "u_last_serviced": "2026-04-01"
    }
]

@router.get("/")
def list_assets():
    res = sn.get_assets()
    if "error" in res:
        return {"result": mock_assets}
    return res

@router.get("/{sys_id}")
def get_asset(sys_id: str):
    res = sn.get_asset(sys_id)
    if "error" in res:
        asset = next((a for a in mock_assets if a["sys_id"] == sys_id), None)
        return {"result": asset}
    return res

@router.post("/")
def create_asset(data: AssetCreate):
    payload = {
        "u_name": data.name,
        "u_type": data.asset_type,
        "u_location": data.location,
        "u_area": data.area,
        "u_status": data.status,
    }
    res = sn.create_asset(payload)
    if "error" in res:
        import uuid
        payload["sys_id"] = str(uuid.uuid4())
        mock_assets.append(payload)
        return {"result": payload}
    return res

@router.patch("/{sys_id}")
def update_asset(sys_id: str, update: AssetUpdate):
    data = {k: v for k, v in update.dict().items() if v}
    res = sn.update_asset(sys_id, data)
    if "error" in res:
        asset = next((a for a in mock_assets if a["sys_id"] == sys_id), None)
        if asset:
            asset.update(data)
            return {"result": asset}
    return res