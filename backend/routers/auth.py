from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
INSTANCE = os.getenv("SERVICENOW_INSTANCE")

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(req: LoginRequest):
    # Fallback mock authentication mapped to AI triage teams
    uname = req.username.lower()
    if uname == "admin" and req.password == "admin":
        return {"success": True, "username": "Admin User", "role": "admin", "userId": "admin"}
    elif uname == "tech" and req.password == "tech":
        return {"success": True, "username": "Facilities Tech", "role": "technician", "userId": "Facilities"}
    elif uname == "security" and req.password == "security":
        return {"success": True, "username": "Security Officer", "role": "security", "userId": "Security"}
    elif uname == "electrician" and req.password == "electrician":
        return {"success": True, "username": "Electrical Tech", "role": "electrician", "userId": "Electrical"}
    elif uname == "plumber" and req.password == "plumber":
        return {"success": True, "username": "Plumbing Tech", "role": "plumber", "userId": "Plumbing"}
    elif uname == "helpstaff" and req.password == "helpstaff":
        return {"success": True, "username": "Help Desk Staff", "role": "helpstaff", "userId": "HR"}
    elif uname == "manager" and req.password == "manager":
        return {"success": True, "username": "Manager User", "role": "manager", "userId": "manager"}
        
    # Attempt actual ServiceNow auth if not mock
    url = f"{INSTANCE}/api/now/table/sys_user?sysparm_limit=1"
    res = requests.get(url, auth=(req.username, req.password))
    
    if res.status_code == 200:
        return {
            "success": True,
            "username": req.username,
            "role": "technician",
            "userId": req.username
        }
        
    raise HTTPException(status_code=401, detail="Invalid credentials")
