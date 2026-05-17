"""
reports.py — Analytics, KPI reports, and export (CSV + PDF) router.

Endpoints:
  GET /reports/incidents   — Incident trend data (by day / team / priority)
  GET /reports/sla         — SLA compliance analysis with breach detail
  GET /reports/assets      — Asset health and maintenance performance
  GET /reports/audit       — Audit log viewer (paginated)
  GET /reports/workorders  — Work order analytics
  GET /reports/export/csv  — Download any report as CSV
  GET /reports/export/pdf  — Download any report as PDF
"""

from __future__ import annotations

import csv
import io
import logging
from datetime import datetime, timezone
from typing import Any

import servicenow as sn
import database as db
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from routers.auth import get_current_user
from routers.incidents import cleanup_snow_record
from security.rbac import RoleChecker

router = APIRouter()
log = logging.getLogger("reports")

SLA_THRESHOLDS = {"1": 30, "2": 120, "3": 240, "4": 480, "5": 1440}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _compute_sla(incidents: list[dict]) -> dict:
    """Compute SLA metrics — compliance rate, breach list, MTTR."""
    resolved = [i for i in incidents if i.get("state") == "6"]
    compliant = 0
    breaches = []
    resolution_times = []

    for inc in resolved:
        priority = str(inc.get("priority", "4"))
        created_str = inc.get("sys_created_on", "")
        resolved_str = inc.get("resolved_at", inc.get("closed_at", ""))
        if not created_str or not resolved_str:
            continue
        try:
            fmt = "%Y-%m-%d %H:%M:%S"
            created = datetime.strptime(created_str[:19], fmt)
            res_dt = datetime.strptime(resolved_str[:19], fmt)
            mins = (res_dt - created).total_seconds() / 60
            hours = mins / 60
            resolution_times.append(hours)
            threshold = SLA_THRESHOLDS.get(priority, 480)
            if mins <= threshold:
                compliant += 1
            else:
                breach_mins = int(mins - threshold)
                breaches.append({
                    "number": inc.get("number"),
                    "priority": priority,
                    "team": inc.get("u_department", "Unknown"),
                    "threshold_mins": threshold,
                    "actual_mins": int(mins),
                    "breach_by_mins": breach_mins,
                })
        except (ValueError, TypeError):
            pass

    total_resolved = len(resolved)
    compliance = round((compliant / total_resolved * 100), 1) if total_resolved else 100.0
    mttr = round(sum(resolution_times) / len(resolution_times), 2) if resolution_times else 0.0
    return {
        "total_incidents": len(incidents),
        "resolved_incidents": total_resolved,
        "sla_compliance_pct": compliance,
        "sla_compliant_count": compliant,
        "sla_breach_count": len(breaches),
        "mttr_hours": mttr,
        "breaches": breaches,
    }


def _team_breakdown(incidents: list[dict]) -> list[dict]:
    teams: dict[str, Any] = {}
    for inc in incidents:
        team = inc.get("u_department", inc.get("assigned_to", "Unassigned")) or "Unassigned"
        if team not in teams:
            teams[team] = {"team": team, "total": 0, "resolved": 0, "open": 0, "critical": 0}
        teams[team]["total"] += 1
        if inc.get("state") == "6":
            teams[team]["resolved"] += 1
        else:
            teams[team]["open"] += 1
        if inc.get("priority") == "1":
            teams[team]["critical"] += 1
    return sorted(teams.values(), key=lambda x: x["total"], reverse=True)


def _priority_breakdown(incidents: list[dict]) -> list[dict]:
    labels = {"1": "Critical", "2": "High", "3": "Medium", "4": "Low", "5": "Planning"}
    result = []
    for p in ["1", "2", "3", "4", "5"]:
        matching = [i for i in incidents if str(i.get("priority", "")) == p]
        result.append({
            "priority": p,
            "label": labels[p],
            "total": len(matching),
            "resolved": len([i for i in matching if i.get("state") == "6"]),
        })
    return result


# ── Report Endpoints ──────────────────────────────────────────────────────────

@router.get("/incidents")
async def incident_report(
    limit: int = Query(default=200),
    user: dict = Depends(get_current_user),
):
    """Comprehensive incident analytics."""
    incidents_res = await sn.get_incidents(limit=limit)
    incidents = [cleanup_snow_record(i) for i in incidents_res.get("result", [])] if isinstance(incidents_res.get("result"), list) else []

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total": len(incidents),
        "open": len([i for i in incidents if i.get("state") in ["1", "2", "3"]]),
        "resolved": len([i for i in incidents if i.get("state") == "6"]),
        "critical": len([i for i in incidents if i.get("priority") == "1"]),
        "iot_auto_created": len([i for i in incidents if i.get("u_reported_via") == "IoT_Sensor"]),
        "priority_breakdown": _priority_breakdown(incidents),
        "team_breakdown": _team_breakdown(incidents),
    }


@router.get("/sla")
async def sla_report(
    limit: int = Query(default=200),
    user: dict = Depends(get_current_user),
):
    """SLA compliance report with breach detail."""
    incidents_res = await sn.get_incidents(limit=limit)
    incidents = [cleanup_snow_record(i) for i in incidents_res.get("result", [])] if isinstance(incidents_res.get("result"), list) else []
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "thresholds": SLA_THRESHOLDS,
        **_compute_sla(incidents),
    }


@router.get("/assets")
async def asset_report(
    airport_id: str = Query(default="SJC-01"),
    user: dict = Depends(get_current_user),
):
    """Asset health and maintenance performance report."""
    assets = db.db_get_assets(airport_id=airport_id)
    tasks = db.db_get_tasks(airport_id=airport_id)
    overdue = [t for t in tasks if t.get("u_status") == "scheduled" and t.get("u_due_date", "9999") < datetime.now().isoformat()]
    status_summary = {}
    for a in assets:
        s = a.get("u_status", "unknown")
        status_summary[s] = status_summary.get(s, 0) + 1
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "airport_id": airport_id,
        "total_assets": len(assets),
        "status_summary": status_summary,
        "assets": assets,
        "preventive_tasks_total": len(tasks),
        "preventive_tasks_overdue": len(overdue),
    }


@router.get("/workorders")
async def workorder_report(
    airport_id: str = Query(default="SJC-01"),
    user: dict = Depends(get_current_user),
):
    """Work order analytics and approval funnel."""
    all_wo = db.db_get_work_orders(airport_id=airport_id)
    status_summary: dict = {}
    approval_summary: dict = {}
    for wo in all_wo:
        s = wo.get("status", "unknown")
        a = wo.get("approval_status", "unknown")
        status_summary[s] = status_summary.get(s, 0) + 1
        approval_summary[a] = approval_summary.get(a, 0) + 1
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total": len(all_wo),
        "status_summary": status_summary,
        "approval_summary": approval_summary,
        "work_orders": all_wo,
    }


@router.get("/audit")
async def audit_report(
    airport_id: str = Query(default="SJC-01"),
    actor: str = Query(default=""),
    action: str = Query(default=""),
    limit: int = Query(default=100, le=500),
    user: dict = Depends(RoleChecker(["admin", "manager"])),
):
    """Paginated audit log with actor/action filtering."""
    logs = db.db_get_audit_logs(airport_id=airport_id, actor=actor, action=action, limit=limit)
    return {"total": len(logs), "logs": logs}


# ── Export Endpoints ──────────────────────────────────────────────────────────

@router.get("/export/csv")
async def export_csv(
    report_type: str = Query(default="incidents", description="incidents | sla | assets | workorders | audit"),
    airport_id: str = Query(default="SJC-01"),
    user: dict = Depends(RoleChecker(["admin", "manager"])),
):
    """Export any report as a downloadable CSV file."""
    data: list[dict] = []

    if report_type == "incidents":
        res = await sn.get_incidents(limit=500)
        data = [cleanup_snow_record(i) for i in res.get("result", [])] if isinstance(res.get("result"), list) else []
    elif report_type == "workorders":
        data = db.db_get_work_orders(airport_id=airport_id)
    elif report_type == "assets":
        data = db.db_get_assets(airport_id=airport_id)
    elif report_type == "audit":
        data = db.db_get_audit_logs(airport_id=airport_id, limit=500)
    elif report_type == "sla":
        res = await sn.get_incidents(limit=500)
        incidents = [cleanup_snow_record(i) for i in res.get("result", [])] if isinstance(res.get("result"), list) else []
        sla = _compute_sla(incidents)
        data = sla.get("breaches", [])
    else:
        raise HTTPException(status_code=400, detail=f"Unknown report type: {report_type}")

    if not data:
        raise HTTPException(status_code=404, detail="No data available for export")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
    writer.writeheader()
    writer.writerows(data)
    output.seek(0)

    filename = f"smart_airport_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/pdf")
async def export_pdf(
    report_type: str = Query(default="incidents"),
    airport_id: str = Query(default="SJC-01"),
    user: dict = Depends(RoleChecker(["admin", "manager"])),
):
    """Export a summary report as a downloadable PDF using ReportLab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab not installed. Run: pip install reportlab")

    # Gather report data
    data_rows: list[list[str]] = []
    title = f"Smart Airport — {report_type.title()} Report"

    if report_type == "incidents":
        res = await sn.get_incidents(limit=200)
        incidents = [cleanup_snow_record(i) for i in res.get("result", [])] if isinstance(res.get("result"), list) else []
        headers = ["Number", "Description", "Priority", "State", "Team", "Location", "Created"]
        for i in incidents[:100]:
            data_rows.append([
                str(i.get("number", "")),
                str(i.get("short_description", ""))[:60],
                f"P{i.get('priority', '')}",
                str(i.get("state", "")),
                str(i.get("u_department", "")),
                str(i.get("location", "")),
                str(i.get("sys_created_on", ""))[:16],
            ])
    elif report_type == "workorders":
        wos = db.db_get_work_orders(airport_id=airport_id)
        headers = ["ID", "Title", "Team", "Status", "Approval", "Priority", "Created"]
        for wo in wos[:100]:
            data_rows.append([
                str(wo.get("sys_id", ""))[:8],
                str(wo.get("title", ""))[:50],
                str(wo.get("assigned_team", "")),
                str(wo.get("status", "")),
                str(wo.get("approval_status", "")),
                f"P{wo.get('priority', '')}",
                str(wo.get("created_at", ""))[:16],
            ])
    elif report_type == "assets":
        assets = db.db_get_assets(airport_id=airport_id)
        headers = ["Name", "Type", "Location", "Terminal", "Status", "Criticality", "Last Serviced"]
        for a in assets:
            data_rows.append([
                str(a.get("u_name", "")),
                str(a.get("u_type", "")),
                str(a.get("u_location", "")),
                str(a.get("u_terminal", "")),
                str(a.get("u_status", "")),
                str(a.get("u_criticality", "")),
                str(a.get("u_last_serviced", ""))[:10],
            ])
    elif report_type == "audit":
        logs = db.db_get_audit_logs(airport_id=airport_id, limit=200)
        headers = ["Timestamp", "Actor", "Action", "Details"]
        for l in logs[:100]:
            data_rows.append([
                str(l.get("timestamp", ""))[:16],
                str(l.get("actor", "")),
                str(l.get("action", "")),
                str(l.get("details", ""))[:80],
            ])
    else:
        raise HTTPException(status_code=400, detail=f"PDF not supported for: {report_type}")

    # Build PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=1.5*cm, rightMargin=1.5*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle("title", parent=styles["Heading1"],
                                 alignment=TA_CENTER, textColor=colors.HexColor("#0EA5E9"),
                                 spaceAfter=12)
    story.append(Paragraph(title, title_style))
    story.append(Paragraph(
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')} | Airport: {airport_id}",
        styles["Normal"]
    ))
    story.append(Spacer(1, 0.5*cm))

    # Summary stats
    story.append(Paragraph(f"Total Records: {len(data_rows)}", styles["Normal"]))
    story.append(Spacer(1, 0.3*cm))

    if data_rows:
        # Table
        table_data = [headers] + data_rows
        col_count = len(headers)
        col_width = (A4[0] - 3*cm) / col_count
        t = Table(table_data, colWidths=[col_width] * col_count, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTSIZE", (0, 1), (-1, -1), 7),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(t)

    # Footer
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        "Smart Airport Management System — Confidential — Not for distribution",
        ParagraphStyle("footer", parent=styles["Normal"], alignment=TA_CENTER,
                       textColor=colors.gray, fontSize=7)
    ))

    doc.build(story)
    buffer.seek(0)
    filename = f"smart_airport_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    return StreamingResponse(
        iter([buffer.read()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
