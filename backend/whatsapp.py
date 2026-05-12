import os
import httpx

WAHA_URL = os.getenv("WAHA_URL", "http://localhost:3000")
WAHA_API_KEY = os.getenv("WAHA_API_KEY", "")


async def ensure_session_started(session="default"):
    """
    Checks if the WAHA session is started. If not, attempts to start it.
    Returns True if session is running or starting, False if failed.
    """
    try:
        headers = {}
        if WAHA_API_KEY:
            headers["X-Api-Key"] = WAHA_API_KEY

        async with httpx.AsyncClient(headers=headers, timeout=5.0) as client:
            # 1. Check status
            try:
                status_res = await client.get(f"{WAHA_URL}/api/sessions/{session}")
                if status_res.status_code == 200:
                    status = status_res.json().get("status")
                    if status in ["STARTING", "SCANNING_QR", "WORKING"]:
                        return True
            except httpx.HTTPError:
                pass

            # 2. Start session if not running
            start_res = await client.post(
                f"{WAHA_URL}/api/sessions/start",
                json={"name": session}
            )
            # 422 means already started, which is fine
            return start_res.status_code in [200, 201, 422]
    except Exception as e:
        print(f"[WAHA] Session init error: {e}")
        return False


async def send_whatsapp(phone, message):
    try:
        # Clean phone number — remove spaces, dashes, +
        phone = phone.replace(" ", "").replace("-", "").replace("+", "")

        # Ensure session is active before sending
        await ensure_session_started()

        headers = {"Content-Type": "application/json"}
        if WAHA_API_KEY:
            headers["X-Api-Key"] = WAHA_API_KEY

        async with httpx.AsyncClient(headers=headers, timeout=10.0) as client:
            res = await client.post(
                f"{WAHA_URL}/api/sendText",
                json={"chatId": f"{phone}@c.us", "text": message, "session": "default"}
            )
            return res.status_code == 200
    except Exception as e:
        print(f"WhatsApp error: {e}")
        return False


async def send_confirmation(phone, inc_number, description):
    message = f"""✅ *Issue Reported Successfully!*

✈️ *Smart Airport Management*

📋 Incident Number: *{inc_number}*
📝 Issue: {description}

Our team has been notified and is working on it!
Please save your incident number to track status.

Thank you for helping us improve your airport experience! 🛫"""
    return await send_whatsapp(phone, message)


async def send_resolution(phone, inc_number):
    message = f"""🎉 *Your Issue Has Been Resolved!*

✈️ *Smart Airport Management*

📋 Incident: *{inc_number}*

Our maintenance team has resolved your reported issue.
We hope your airport experience is better now!

Please rate your experience in the app ⭐"""
    return await send_whatsapp(phone, message)


async def send_sla_warning(phone, inc_number, priority):
    message = f"""🚨 *SLA Breach Warning*

✈️ *Smart Airport Management*

📋 Incident: *{inc_number}*
⚡ Priority: P{priority}

This incident is approaching SLA breach.
Immediate action required!"""
    return await send_whatsapp(phone, message)


async def send_credentials_wa(phone, role, username, password):
    message = f"""🔐 *Smart Airport Staff Access*

Welcome to the team! Your access for the role of *{role}* has been approved.

👤 *Username:* {username}
🔑 *Password:* {password}

Please log in via the Smart Airport mobile application to access your dashboard and tasks.

_Keep these credentials secure._"""
    return await send_whatsapp(phone, message)
