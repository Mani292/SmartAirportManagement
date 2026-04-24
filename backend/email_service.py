import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SENDER = os.getenv("EMAIL_SENDER")
PASSWORD = os.getenv("EMAIL_PASSWORD")

def send_email(to, subject, html_body):
    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(SENDER, PASSWORD)
        server.sendmail(SENDER, to, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_task_assignment(to, inc_number, description, location, priority, action):
    priority_labels = {
        "1": "🔴 P1 Critical",
        "2": "🟠 P2 High",
        "3": "🟡 P3 Medium",
        "4": "🟢 P4 Low"
    }
    p_label = priority_labels.get(str(priority), f"P{priority}")
    return send_email(
        to,
        f"[{p_label}] New Task Assigned — {inc_number}",
        f"""
<div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:10px;overflow:hidden">
  <div style="background:#0D1B3E;padding:24px">
    <h2 style="color:white;margin:0">✈️ Smart Airport Management</h2>
    <p style="color:#A8D8FF;margin:6px 0 0 0">New Maintenance Task Assigned</p>
  </div>
  <div style="padding:24px">
    <p><b>Incident Number:</b> {inc_number}</p>
    <p><b>Priority:</b> {p_label}</p>
    <p><b>Location:</b> {location}</p>
    <p><b>Description:</b> {description}</p>
    <div style="background:#D6E8F7;padding:16px;border-radius:8px;margin-top:16px">
      <b>🤖 AI Recommended First Action:</b><br><br>{action}
    </div>
    <p style="margin-top:20px;color:#666;font-size:13px">
      Please open the Smart Airport Management app to update this task.
    </p>
  </div>
</div>"""
    )

def send_sla_breach(to, inc_number, priority, elapsed_mins):
    return send_email(
        to,
        f"🚨 SLA BREACH ALERT — {inc_number}",
        f"""
<div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:10px;overflow:hidden">
  <div style="background:#C0392B;padding:24px">
    <h2 style="color:white;margin:0">🚨 SLA Breach Alert</h2>
    <p style="color:#FAD7D3;margin:6px 0 0 0">Smart Airport Management</p>
  </div>
  <div style="padding:24px">
    <p><b>Incident Number:</b> {inc_number}</p>
    <p><b>Priority:</b> P{priority}</p>
    <p><b>Time Elapsed:</b> {elapsed_mins} minutes</p>
    <div style="background:#FAD7D3;padding:16px;border-radius:8px;margin-top:16px">
      <b style="color:#C0392B">⚠️ This incident has breached its SLA target.</b><br>
      Immediate escalation and action required!
    </div>
  </div>
</div>"""
    )

def send_daily_summary(to, total, resolved, overdue):
    return send_email(
        to,
        "📊 Daily Airport Operations Summary",
        f"""
<div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:10px;overflow:hidden">
  <div style="background:#0D1B3E;padding:24px">
    <h2 style="color:white;margin:0">📊 Daily Operations Summary</h2>
    <p style="color:#A8D8FF;margin:6px 0 0 0">Smart Airport Management</p>
  </div>
  <div style="padding:24px">
    <div style="display:flex;gap:16px;margin-top:8px">
      <div style="background:#D6E8F7;padding:20px;border-radius:8px;flex:1;text-align:center">
        <h2 style="margin:0;color:#1A3A6B">{total}</h2>
        <p style="margin:4px 0 0 0;color:#666">Total Incidents</p>
      </div>
      <div style="background:#D5F0E3;padding:20px;border-radius:8px;flex:1;text-align:center">
        <h2 style="margin:0;color:#1A7A4A">{resolved}</h2>
        <p style="margin:4px 0 0 0;color:#666">Resolved</p>
      </div>
      <div style="background:#FAD7D3;padding:20px;border-radius:8px;flex:1;text-align:center">
        <h2 style="margin:0;color:#C0392B">{overdue}</h2>
        <p style="margin:4px 0 0 0;color:#666">Overdue</p>
      </div>
    </div>
  </div>
</div>"""
    )