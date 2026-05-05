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
    role: str

@router.post("/login")
def login(req: LoginRequest):
    # Authenticate by making a test request to ServiceNow using the provided credentials
    url = f"{INSTANCE}/api/now/table/sys_user?sysparm_limit=1"
    res = requests.get(url, auth=(req.username, req.password))
    
    if res.status_code == 200:
        # User is authenticated via ServiceNow
        return {
            "success": True,
            "username": req.username,
            "role": req.role,
            "userId": f"{req.username}_sn"
        }
    else:
        # Fallback to mock authentication for testing if ServiceNow is not fully configured for all users
        if req.username == "admin" and req.password == "admin":
            return {"success": True, "username": "Admin User", "role": "admin", "userId": "admin_001"}
        elif req.username == "tech" and req.password == "tech":
            return {"success": True, "username": "Technician User", "role": "technician", "userId": "tech_001"}
        elif req.username == "security" and req.password == "security":
            return {"success": True, "username": "Security Officer", "role": "security", "userId": "sec_001"}
        elif req.username == "electrician" and req.password == "electrician":
            return {"success": True, "username": "Electrical Tech", "role": "electrician", "userId": "elec_001"}
        elif req.username == "plumber" and req.password == "plumber":
            return {"success": True, "username": "Plumbing Tech", "role": "plumber", "userId": "plumb_001"}
        elif req.username == "helpstaff" and req.password == "helpstaff":
            return {"success": True, "username": "Help Desk Staff", "role": "helpstaff", "userId": "help_001"}
        elif req.username == "manager" and req.password == "manager":
            return {"success": True, "username": "Manager User", "role": "manager", "userId": "mgr_001"}
            
        raise HTTPException(status_code=401, detail="Invalid credentials in ServiceNow")
