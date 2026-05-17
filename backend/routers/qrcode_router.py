import io
import os
import database as db
import qrcode
import servicenow as sn
from fastapi import APIRouter, Depends
from routers.auth import get_current_user
from security.rbac import RoleChecker
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from logger.audit import log_audit

router = APIRouter()


class QRCreate(BaseModel):
    terminal: str
    area: str
    location_code: str


@router.post("/generate")
async def generate_qr(data: QRCreate, user: dict = Depends(RoleChecker(["admin", "manager"]))):
    """Generate a QR code PNG that routes passengers to the passenger portal."""
    base_url = os.getenv("FRONTEND_URL", "https://smart-airport.vercel.app")
    url = (
        f"{base_url}/"
        f"?location={data.terminal}&area={data.area}&code={data.location_code}"
    )
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    
    log_audit(user["username"], "GENERATE_QR", f"Location: {data.terminal} — {data.area}")
    return StreamingResponse(buf, media_type="image/png")


@router.get("/locations")
async def get_locations(user: dict = Depends(get_current_user)):
    res = await sn.get_qr_locations()
    if "error" in res:
        return {"result": db.db_get_qr_locations(), "source": "fallback_db"}
    return res


@router.post("/locations")
async def create_location(data: QRCreate, user: dict = Depends(RoleChecker(["admin", "manager"]))):
    payload = {
        "u_terminal": data.terminal,
        "u_area": data.area,
        "u_location_code": data.location_code,
    }
    res = await sn.create_qr_location(payload)
    if "error" in res:
        created = db.db_create_qr_location(payload)
        log_audit(user["username"], "CREATE_QR_LOC_FALLBACK", f"Code: {data.location_code}")
        return {"result": created, "source": "fallback_db"}
    
    log_audit(user["username"], "CREATE_QR_LOC", f"Code: {data.location_code}")
    return res
