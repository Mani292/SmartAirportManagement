import os

import requests

WAHA_URL = os.getenv("WAHA_URL", "http://localhost:3000")
WAHA_API_KEY = os.getenv("WAHA_API_KEY", "")


def send_whatsapp(phone, message):
    try:
        # Clean phone number — remove spaces, dashes, +
        phone = phone.replace(" ", "").replace("-", "").replace("+", "")

        headers = {"Content-Type": "application/json"}
        if WAHA_API_KEY:
            headers["X-Api-Key"] = WAHA_API_KEY

        res = requests.post(
            f"{WAHA_URL}/api/sendText",
            headers=headers,
            json={"chatId": f"{phone}@c.us", "text": message, "session": "default"},
        )
        return res.status_code == 200
    except Exception as e:
        print(f"WhatsApp error: {e}")
        return False


def send_confirmation(phone, inc_number, description):
    message = f"""✅ *Issue Reported Successfully!*

✈️ *Smart Airport Management*

📋 Incident Number: *{inc_number}*
📝 Issue: {description}

Our team has been notified and is working on it!
Please save your incident number to track status.

Thank you for helping us improve your airport experience! 🛫"""
    return send_whatsapp(phone, message)


def send_resolution(phone, inc_number):
    message = f"""🎉 *Your Issue Has Been Resolved!*

✈️ *Smart Airport Management*

📋 Incident: *{inc_number}*

Our maintenance team has resolved your reported issue.
We hope your airport experience is better now!

Please rate your experience in the app ⭐"""
    return send_whatsapp(phone, message)


def send_sla_warning(phone, inc_number, priority):
    message = f"""🚨 *SLA Breach Warning*

✈️ *Smart Airport Management*

📋 Incident: *{inc_number}*
⚡ Priority: P{priority}

This incident is approaching SLA breach.
Immediate action required!"""
    return send_whatsapp(phone, message)


def send_credentials_wa(phone, role, username, password):
    message = f"""🔐 *Smart Airport Staff Access*

Welcome to the team! Your access for the role of *{role}* has been approved.

👤 *Username:* {username}
🔑 *Password:* {password}

Please log in via the Smart Airport mobile application to access your dashboard and tasks.

_Keep these credentials secure._"""
    return send_whatsapp(phone, message)
