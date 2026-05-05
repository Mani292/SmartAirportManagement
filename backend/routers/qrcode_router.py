from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import qrcode
import io
import servicenow as sn

router = APIRouter()

class QRCreate(BaseModel):
    terminal: str
    area: str
    location_code: str

@router.post("/generate")
def generate_qr(data: QRCreate):
    # Route passengers to the static website with query parameters
    url = f"http://localhost:5173/?location={data.terminal}&area={data.area}&code={data.location_code}"

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")

# Fallback in-memory DB
mock_locations = [
    {
        "sys_id": "mock_qr_1",
        "u_terminal": "Terminal 1",
        "u_area": "Restroom",
        "u_location_code": "T1-R-A"
    }
]

@router.get("/locations")
def get_locations():
    res = sn.get_qr_locations()
    if "error" in res:
        return {"result": mock_locations}
    return res

@router.post("/locations")
def create_location(data: QRCreate):
    payload = {
        "u_terminal": data.terminal,
        "u_area": data.area,
        "u_location_code": data.location_code
    }
    res = sn.create_qr_location(payload)
    if "error" in res:
        import uuid
        payload["sys_id"] = str(uuid.uuid4())
        mock_locations.append(payload)
        return {"result": payload}
    return res