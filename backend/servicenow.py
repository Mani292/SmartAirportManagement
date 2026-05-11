import os

import requests
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv()

INSTANCE = os.getenv("SERVICENOW_INSTANCE")
USERNAME = os.getenv("SERVICENOW_USERNAME")
PASSWORD = os.getenv("SERVICENOW_PASSWORD")

auth = HTTPBasicAuth(USERNAME, PASSWORD)
headers = {"Content-Type": "application/json", "Accept": "application/json"}


# ── INCIDENTS ──
def get_incidents(limit=50, query=""):
    url = f"{INSTANCE}/api/now/table/incident"
    params = {
        "sysparm_limit": limit,
        "sysparm_orderbydesc": "sys_created_on",
        "sysparm_query": query,
        "sysparm_fields": "sys_id,number,short_description,priority,state,assigned_to,location,sys_created_on,u_area,u_department,u_ai_category,u_reported_via,u_safety_risk,u_estimated_fix_mins,u_recommended_action,u_reporter_phone,u_passenger_rating",
    }
    res = requests.get(url, auth=auth, headers=headers, params=params)
    return res.json()


def get_incident(sys_id):
    url = f"{INSTANCE}/api/now/table/incident/{sys_id}"
    res = requests.get(url, auth=auth, headers=headers)
    return res.json()


def get_incident_by_number(number):
    url = f"{INSTANCE}/api/now/table/incident"
    params = {"sysparm_query": f"number={number}", "sysparm_limit": 1}
    res = requests.get(url, auth=auth, headers=headers, params=params)
    return res.json()


def create_incident(data):
    url = f"{INSTANCE}/api/now/table/incident"
    res = requests.post(url, auth=auth, headers=headers, json=data)
    return res.json()


def update_incident(sys_id, data):
    url = f"{INSTANCE}/api/now/table/incident/{sys_id}"
    res = requests.patch(url, auth=auth, headers=headers, json=data)
    return res.json()


# ── ASSETS ──
def get_assets(limit=50):
    url = f"{INSTANCE}/api/now/table/u_airport_asset"
    params = {"sysparm_limit": limit}
    res = requests.get(url, auth=auth, headers=headers, params=params)
    return res.json()


def get_asset(sys_id):
    url = f"{INSTANCE}/api/now/table/u_airport_asset/{sys_id}"
    res = requests.get(url, auth=auth, headers=headers)
    return res.json()


def create_asset(data):
    url = f"{INSTANCE}/api/now/table/u_airport_asset"
    res = requests.post(url, auth=auth, headers=headers, json=data)
    return res.json()


def update_asset(sys_id, data):
    url = f"{INSTANCE}/api/now/table/u_airport_asset/{sys_id}"
    res = requests.patch(url, auth=auth, headers=headers, json=data)
    return res.json()


# ── PREVENTIVE MAINTENANCE ──
def get_preventive_tasks(limit=50):
    url = f"{INSTANCE}/api/now/table/u_preventive_schedule"
    params = {"sysparm_limit": limit}
    res = requests.get(url, auth=auth, headers=headers, params=params)
    return res.json()


def create_preventive_task(data):
    url = f"{INSTANCE}/api/now/table/u_preventive_schedule"
    res = requests.post(url, auth=auth, headers=headers, json=data)
    return res.json()


def update_preventive_task(sys_id, data):
    url = f"{INSTANCE}/api/now/table/u_preventive_schedule/{sys_id}"
    res = requests.patch(url, auth=auth, headers=headers, json=data)
    return res.json()


# ── QR LOCATIONS ──
def get_qr_locations():
    url = f"{INSTANCE}/api/now/table/u_qr_location"
    res = requests.get(url, auth=auth, headers=headers)
    return res.json()


def create_qr_location(data):
    url = f"{INSTANCE}/api/now/table/u_qr_location"
    res = requests.post(url, auth=auth, headers=headers, json=data)
    return res.json()


# ── IoT & TELEMETRY (Future Scope Scaffolding) ──
def log_telemetry(data):
    """
    Log sensor data to ServiceNow u_iot_telemetry table.
    Includes u_airport_id for multi-tenant isolation.
    """
    url = f"{INSTANCE}/api/now/table/u_iot_telemetry"
    # Ensure multi-tenancy ID is present
    data.setdefault("u_airport_id", "SJC-01")
    res = requests.post(url, auth=auth, headers=headers, json=data)
    return res.json()


def get_asset_health_metrics(asset_id):
    """Fetch recent telemetry for an asset to perform anomaly detection."""
    url = f"{INSTANCE}/api/now/table/u_iot_telemetry"
    params = {
        "sysparm_query": f"u_asset={asset_id}",
        "sysparm_limit": 10,
        "sysparm_orderbydesc": "sys_created_on"
    }
    res = requests.get(url, auth=auth, headers=headers, params=params)
    return res.json()


# ── AIRPORT-SPECIFIC ASSET TABLES (Lifecycle Management) ──
def get_baggage_systems():
    url = f"{INSTANCE}/api/now/table/u_baggage_system"
    res = requests.get(url, auth=auth, headers=headers)
    return res.json()


def get_hvac_systems():
    url = f"{INSTANCE}/api/now/table/u_hvac_system"
    res = requests.get(url, auth=auth, headers=headers)
    return res.json()


def get_runway_lighting():
    url = f"{INSTANCE}/api/now/table/u_runway_light"
    res = requests.get(url, auth=auth, headers=headers)
    return res.json()
