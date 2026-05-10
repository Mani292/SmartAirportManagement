"""
database.py — SQLite persistence layer for Smart Airport Management fallback DB.
Replaces the volatile module-level Python lists used in assets.py, preventive.py,
and qrcode_router.py. Data survives server restarts and is thread-safe via the
check_same_thread=False + connection-per-call pattern.
"""

import sqlite3
from pathlib import Path

# Store the DB alongside the backend code (one directory up from routers)
DB_PATH = Path(__file__).parent / "airport.db"


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection with row_factory set for dict-style access."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they don't already exist. Called on FastAPI startup."""
    conn = get_connection()
    try:
        c = conn.cursor()

        # ── Assets ─────────────────────────────────────────────────────────────
        c.execute("""
            CREATE TABLE IF NOT EXISTS fallback_assets (
                sys_id          TEXT PRIMARY KEY,
                u_name          TEXT NOT NULL,
                u_type          TEXT NOT NULL,
                u_location      TEXT NOT NULL,
                u_terminal      TEXT NOT NULL,
                u_status        TEXT DEFAULT 'operational',
                u_last_serviced TEXT DEFAULT '',
                notes           TEXT DEFAULT ''
            )
        """)

        # Seed default asset if table is empty
        c.execute("SELECT COUNT(*) FROM fallback_assets")
        if c.fetchone()[0] == 0:
            c.execute("""
                INSERT INTO fallback_assets VALUES
                ('mock_asset_1','Elevator T1-A','Elevator','Gate 5','Terminal 1','operational','2026-04-01','')
            """)

        # ── Preventive Tasks ────────────────────────────────────────────────────
        c.execute("""
            CREATE TABLE IF NOT EXISTS fallback_tasks (
                sys_id          TEXT PRIMARY KEY,
                u_title         TEXT NOT NULL,
                u_asset_name    TEXT NOT NULL,
                u_assigned_team TEXT NOT NULL,
                u_due_date      TEXT NOT NULL,
                u_frequency     TEXT DEFAULT 'Monthly',
                u_description   TEXT DEFAULT '',
                u_status        TEXT DEFAULT 'scheduled',
                notes           TEXT DEFAULT '',
                completed_date  TEXT DEFAULT ''
            )
        """)

        c.execute("SELECT COUNT(*) FROM fallback_tasks")
        if c.fetchone()[0] == 0:
            c.execute("""
                INSERT INTO fallback_tasks VALUES
                ('mock_prev_1','Monthly Elevator Inspection','Elevator T1-A',
                 'Facilities Team','2026-05-01 00:00:00','Monthly',
                 'Check cables and door sensors.','scheduled','','')
            """)

        # ── QR Locations ────────────────────────────────────────────────────────
        c.execute("""
            CREATE TABLE IF NOT EXISTS fallback_qr_locations (
                sys_id          TEXT PRIMARY KEY,
                u_terminal      TEXT NOT NULL,
                u_area          TEXT NOT NULL,
                u_location_code TEXT NOT NULL UNIQUE
            )
        """)

        c.execute("SELECT COUNT(*) FROM fallback_qr_locations")
        if c.fetchone()[0] == 0:
            c.execute("""
                INSERT INTO fallback_qr_locations VALUES
                ('mock_qr_1','Terminal 1','Restroom','T1-R-A')
            """)

        conn.commit()
        print("[DB] SQLite initialized ->", DB_PATH)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# Asset helpers
# ══════════════════════════════════════════════════════════════════════════════


def db_get_assets() -> list[dict]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM fallback_assets").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def db_get_asset(sys_id: str) -> dict | None:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM fallback_assets WHERE sys_id = ?", (sys_id,)
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def db_create_asset(payload: dict) -> dict:
    import uuid

    payload.setdefault("sys_id", str(uuid.uuid4()))
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT OR IGNORE INTO fallback_assets
            (sys_id, u_name, u_type, u_location, u_terminal, u_status, u_last_serviced, notes)
            VALUES (:sys_id, :u_name, :u_type, :u_location, :u_terminal,
                    :u_status, :u_last_serviced, :notes)
        """,
            {
                "sys_id": payload.get("sys_id"),
                "u_name": payload.get("u_name", payload.get("name", "")),
                "u_type": payload.get("u_type", payload.get("asset_type", "")),
                "u_location": payload.get("u_location", payload.get("location", "")),
                "u_terminal": payload.get("u_terminal", payload.get("area", "")),
                "u_status": payload.get(
                    "u_status", payload.get("status", "operational")
                ),
                "u_last_serviced": payload.get("u_last_serviced", ""),
                "notes": payload.get("notes", ""),
            },
        )
        conn.commit()
        return db_get_asset(payload["sys_id"]) or payload
    finally:
        conn.close()


def db_update_asset(sys_id: str, updates: dict) -> dict | None:
    if not updates:
        return db_get_asset(sys_id)
    conn = get_connection()
    try:
        fields = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [sys_id]
        conn.execute(f"UPDATE fallback_assets SET {fields} WHERE sys_id = ?", values)
        conn.commit()
        return db_get_asset(sys_id)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# Preventive task helpers
# ══════════════════════════════════════════════════════════════════════════════


def db_get_tasks() -> list[dict]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM fallback_tasks").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def db_get_task(sys_id: str) -> dict | None:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM fallback_tasks WHERE sys_id = ?", (sys_id,)
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def db_create_task(payload: dict) -> dict:
    import uuid

    payload.setdefault("sys_id", str(uuid.uuid4()))
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT OR IGNORE INTO fallback_tasks
            (sys_id, u_title, u_asset_name, u_assigned_team, u_due_date,
             u_frequency, u_description, u_status, notes, completed_date)
            VALUES (:sys_id,:u_title,:u_asset_name,:u_assigned_team,:u_due_date,
                    :u_frequency,:u_description,:u_status,:notes,:completed_date)
        """,
            {
                "sys_id": payload.get("sys_id"),
                "u_title": payload.get("u_title", ""),
                "u_asset_name": payload.get("u_asset_name", ""),
                "u_assigned_team": payload.get("u_assigned_team", ""),
                "u_due_date": payload.get("u_due_date", ""),
                "u_frequency": payload.get("u_frequency", "Monthly"),
                "u_description": payload.get("u_description", ""),
                "u_status": payload.get("u_status", "scheduled"),
                "notes": payload.get("notes", ""),
                "completed_date": payload.get("completed_date", ""),
            },
        )
        conn.commit()
        return db_get_task(payload["sys_id"]) or payload
    finally:
        conn.close()


def db_update_task(sys_id: str, updates: dict) -> dict | None:
    if not updates:
        return db_get_task(sys_id)
    conn = get_connection()
    try:
        fields = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [sys_id]
        conn.execute(f"UPDATE fallback_tasks SET {fields} WHERE sys_id = ?", values)
        conn.commit()
        return db_get_task(sys_id)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# QR location helpers
# ══════════════════════════════════════════════════════════════════════════════


def db_get_qr_locations() -> list[dict]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM fallback_qr_locations").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def db_create_qr_location(payload: dict) -> dict:
    import uuid

    payload.setdefault("sys_id", str(uuid.uuid4()))
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT OR IGNORE INTO fallback_qr_locations (sys_id, u_terminal, u_area, u_location_code)
            VALUES (:sys_id, :u_terminal, :u_area, :u_location_code)
        """,
            {
                "sys_id": payload.get("sys_id"),
                "u_terminal": payload.get("u_terminal", ""),
                "u_area": payload.get("u_area", ""),
                "u_location_code": payload.get("u_location_code", ""),
            },
        )
        conn.commit()
        return payload
    finally:
        conn.close()
