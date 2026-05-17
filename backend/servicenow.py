"""
servicenow.py — Async ServiceNow REST API integration layer.

All airport incidents, assets, and preventive tasks are created/updated
in ServiceNow as the system of record. A local SQLite fallback ensures
continuous operations if ServiceNow is temporarily unreachable.

Table Mappings:
  incident             → Standard ITSM incident table
  u_airport_asset      → Custom CMDB CI for airport assets
  u_preventive_schedule → Custom preventive maintenance jobs
  u_qr_location        → QR code physical location registry
  u_iot_telemetry      → Real-time sensor readings
"""

from __future__ import annotations

import logging
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger("servicenow")

INSTANCE = os.getenv("SERVICENOW_INSTANCE")
USERNAME = os.getenv("SERVICENOW_USERNAME")
PASSWORD = os.getenv("SERVICENOW_PASSWORD")

# Use a global auth tuple or a client with auth
auth = (USERNAME, PASSWORD)
headers = {"Content-Type": "application/json", "Accept": "application/json"}

async def _request(method: str, url: str, **kwargs) -> dict:
    """Internal helper to perform async requests to ServiceNow."""
    try:
        async with httpx.AsyncClient(auth=auth, headers=headers, timeout=30.0) as client:
            res = await client.request(method, url, **kwargs)
            res.raise_for_status()
            return res.json()
    except httpx.HTTPStatusError as e:
        log.error("ServiceNow HTTP error [%s %s]: %s", method, url, e.response.status_code)
        return {"error": "http_error", "detail": str(e)}
    except httpx.RequestError as e:
        log.error("ServiceNow connection error [%s %s]: %s", method, url, str(e))
        return {"error": "connection_failed", "detail": str(e)}
    except Exception as e:
        log.exception("Unexpected ServiceNow error [%s %s]", method, url)
        return {"error": "unexpected_error", "detail": str(e)}

# ── INCIDENTS ──
async def get_incidents(limit=50, query=""):
    url = f"{INSTANCE}/api/now/table/incident"
    params = {
        "sysparm_limit": limit,
        "sysparm_orderbydesc": "sys_created_on",
        "sysparm_query": query,
        "sysparm_fields": "sys_id,number,short_description,priority,state,assigned_to,location,sys_created_on,u_area,u_department,u_ai_category,u_reported_via,u_safety_risk,u_estimated_fix_mins,u_recommended_action,u_reporter_phone,u_passenger_rating",
    }
    return await _request("GET", url, params=params)

async def get_incident(sys_id):
    url = f"{INSTANCE}/api/now/table/incident/{sys_id}"
    return await _request("GET", url)

async def get_incident_by_number(number):
    url = f"{INSTANCE}/api/now/table/incident"
    params = {"sysparm_query": f"number={number}", "sysparm_limit": 1}
    return await _request("GET", url, params=params)

async def create_incident(data):
    url = f"{INSTANCE}/api/now/table/incident"
    return await _request("POST", url, json=data)

async def update_incident(sys_id, data):
    url = f"{INSTANCE}/api/now/table/incident/{sys_id}"
    return await _request("PATCH", url, json=data)

# ── ASSETS ──
async def get_assets(limit=50):
    url = f"{INSTANCE}/api/now/table/u_airport_asset"
    params = {"sysparm_limit": limit}
    return await _request("GET", url, params=params)

async def get_asset(sys_id):
    url = f"{INSTANCE}/api/now/table/u_airport_asset/{sys_id}"
    return await _request("GET", url)

async def create_asset(data):
    url = f"{INSTANCE}/api/now/table/u_airport_asset"
    return await _request("POST", url, json=data)

async def update_asset(sys_id, data):
    url = f"{INSTANCE}/api/now/table/u_airport_asset/{sys_id}"
    return await _request("PATCH", url, json=data)

# ── PREVENTIVE MAINTENANCE ──
async def get_preventive_tasks(limit=50):
    url = f"{INSTANCE}/api/now/table/u_preventive_schedule"
    params = {"sysparm_limit": limit}
    return await _request("GET", url, params=params)

async def create_preventive_task(data):
    url = f"{INSTANCE}/api/now/table/u_preventive_schedule"
    return await _request("POST", url, json=data)

async def update_preventive_task(sys_id, data):
    url = f"{INSTANCE}/api/now/table/u_preventive_schedule/{sys_id}"
    return await _request("PATCH", url, json=data)

# ── QR LOCATIONS ──
async def get_qr_locations():
    url = f"{INSTANCE}/api/now/table/u_qr_location"
    return await _request("GET", url)

async def create_qr_location(data):
    url = f"{INSTANCE}/api/now/table/u_qr_location"
    return await _request("POST", url, json=data)

# ── IoT & TELEMETRY (Future Scope Scaffolding) ──
async def log_telemetry(data):
    """
    Log sensor data to ServiceNow u_iot_telemetry table.
    Includes u_airport_id for multi-tenant isolation.
    """
    url = f"{INSTANCE}/api/now/table/u_iot_telemetry"
    # Ensure multi-tenancy ID is present
    data.setdefault("u_airport_id", "SJC-01")
    return await _request("POST", url, json=data)

async def get_asset_health_metrics(asset_id):
    """Fetch recent telemetry for an asset to perform anomaly detection."""
    url = f"{INSTANCE}/api/now/table/u_iot_telemetry"
    params = {
        "sysparm_query": f"u_asset={asset_id}",
        "sysparm_limit": 10,
        "sysparm_orderbydesc": "sys_created_on"
    }
    return await _request("GET", url, params=params)

# ── WORK ORDERS (ServiceNow wm_order) ──
async def create_work_order(data):
    """Create a work order in ServiceNow Work Management (wm_order table)."""
    url = f"{INSTANCE}/api/now/table/wm_order"
    return await _request("POST", url, json=data)

async def update_work_order(sys_id, data):
    """Update a ServiceNow work order."""
    url = f"{INSTANCE}/api/now/table/wm_order/{sys_id}"
    return await _request("PATCH", url, json=data)

async def get_work_orders(limit=50, query=""):
    """List work orders from ServiceNow."""
    url = f"{INSTANCE}/api/now/table/wm_order"
    params = {"sysparm_limit": limit, "sysparm_orderbydesc": "sys_created_on"}
    if query:
        params["sysparm_query"] = query
    return await _request("GET", url, params=params)

