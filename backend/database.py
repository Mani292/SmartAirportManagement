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

        # ── Assets (ServiceNow CMDB Model) ─────────────────────────────────────
        c.execute("""
            CREATE TABLE IF NOT EXISTS u_airport_asset (
                sys_id          TEXT PRIMARY KEY,
                u_airport_id    TEXT DEFAULT 'SJC-01',
                u_name          TEXT NOT NULL,
                u_type          TEXT NOT NULL,
                u_location      TEXT NOT NULL,
                u_terminal      TEXT NOT NULL,
                u_status        TEXT DEFAULT 'operational',
                u_last_serviced TEXT DEFAULT '',
                u_criticality   TEXT DEFAULT 'Medium',
                notes           TEXT DEFAULT ''
            )
        """)
        # Specific CMDB child tables
        c.execute("CREATE TABLE IF NOT EXISTS u_hvac_system (sys_id TEXT PRIMARY KEY, u_airport_id TEXT, cooling_capacity TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS u_baggage_system (sys_id TEXT PRIMARY KEY, u_airport_id TEXT, belt_length TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS u_runway (sys_id TEXT PRIMARY KEY, u_airport_id TEXT, surface_type TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS u_escalator (sys_id TEXT PRIMARY KEY, u_airport_id TEXT, steps_count INTEGER)")
        c.execute("CREATE TABLE IF NOT EXISTS u_digital_display (sys_id TEXT PRIMARY KEY, u_airport_id TEXT, resolution TEXT)")


        # Seed default assets if table is empty
        c.execute("SELECT COUNT(*) FROM u_airport_asset")
        if c.fetchone()[0] == 0:
            c.execute("""
                INSERT INTO u_airport_asset (sys_id, u_airport_id, u_name, u_type, u_location, u_terminal, u_status, u_last_serviced, u_criticality) VALUES
                ('mock_asset_1','SJC-01','Elevator T1-A','Elevator','Gate 5','Terminal 1','operational','2026-04-01', 'High'),
                ('mock_asset_2','SJC-01','Baggage Belt 4','Baggage Conveyor','Arrivals','Terminal 2','operational','2026-03-15', 'High'),
                ('mock_asset_3','SJC-01','HVAC Unit 12','HVAC','Roof','Terminal 1','maintenance','2026-05-01', 'Medium'),
                ('mock_asset_4','SJC-01','Runway Light 22L','Runway Lighting','Runway 22L','Airside','operational','2026-04-20', 'Critical')
            """)

        # ── IoT Telemetry (ServiceNow Model) ────────────────────────────────────
        c.execute("""
            CREATE TABLE IF NOT EXISTS u_iot_sensor (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                u_airport_id    TEXT DEFAULT 'SJC-01',
                asset_id        TEXT NOT NULL,
                temperature     REAL,
                vibration       REAL,
                humidity        REAL,
                status          TEXT,
                timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ── Maintenance History ────────────────────────────────────────────────
        c.execute("""
            CREATE TABLE IF NOT EXISTS u_maintenance_history (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                u_airport_id    TEXT DEFAULT 'SJC-01',
                asset_id        TEXT NOT NULL,
                technician_id   TEXT,
                action_taken    TEXT,
                parts_replaced  TEXT,
                cost            REAL,
                timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ── Preventive Tasks ────────────────────────────────────────────────────
        c.execute("""
            CREATE TABLE IF NOT EXISTS u_preventive_task (
                sys_id          TEXT PRIMARY KEY,
                u_airport_id    TEXT DEFAULT 'SJC-01',
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

        c.execute("SELECT COUNT(*) FROM u_preventive_task")
        if c.fetchone()[0] == 0:
            c.execute("""
                INSERT INTO u_preventive_task VALUES
                ('mock_prev_1','SJC-01','Monthly Elevator Inspection','Elevator T1-A',
                 'Facilities Team','2026-05-01 00:00:00','Monthly',
                 'Check cables and door sensors.','scheduled','','')
            """)

        # ── QR Locations ────────────────────────────────────────────────────────
        c.execute("""
            CREATE TABLE IF NOT EXISTS u_qr_location (
                sys_id          TEXT PRIMARY KEY,
                u_airport_id    TEXT DEFAULT 'SJC-01',
                u_terminal      TEXT NOT NULL,
                u_area          TEXT NOT NULL,
                u_location_code TEXT NOT NULL UNIQUE
            )
        """)

        c.execute("SELECT COUNT(*) FROM u_qr_location")
        if c.fetchone()[0] == 0:
            c.execute("""
                INSERT INTO u_qr_location VALUES
                ('mock_qr_1','SJC-01','Terminal 1','Restroom','T1-R-A')
            """)

        # ── Audit Logs ─────────────────────────────────────────────────────────
        c.execute("""
            CREATE TABLE IF NOT EXISTS u_audit_log (
                sys_id          TEXT PRIMARY KEY,
                u_airport_id    TEXT DEFAULT 'SJC-01',
                actor           TEXT,
                action          TEXT,
                details         TEXT,
                timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ── ESG Sustainability Metrics ─────────────────────────────────────────
        c.execute("""
            CREATE TABLE IF NOT EXISTS u_energy_metrics (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                u_airport_id    TEXT DEFAULT 'SJC-01',
                asset_id        TEXT NOT NULL,
                kwh_consumed    REAL,
                carbon_saved    REAL,
                timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ── Work Orders ────────────────────────────────────────────────────────
        c.execute(
            "CREATE TABLE IF NOT EXISTS u_work_order ("
            "  sys_id              TEXT PRIMARY KEY,"
            "  u_airport_id        TEXT DEFAULT 'SJC-01',"
            "  title               TEXT NOT NULL,"
            "  description         TEXT DEFAULT '',"
            "  linked_incident_id  TEXT DEFAULT '',"
            "  sn_incident_sys_id  TEXT DEFAULT '',"
            "  sn_work_order_sys_id TEXT DEFAULT '',"
            "  assigned_team       TEXT DEFAULT '',"
            "  assigned_to         TEXT DEFAULT '',"
            "  priority            TEXT DEFAULT '3',"
            "  status              TEXT DEFAULT 'open',"
            "  approval_status     TEXT DEFAULT 'not_required',"
            "  approved_by         TEXT DEFAULT '',"
            "  approval_notes      TEXT DEFAULT '',"
            "  technician_notes    TEXT DEFAULT '',"
            "  asset_id            TEXT DEFAULT '',"
            "  location            TEXT DEFAULT '',"
            "  sla_target          TEXT DEFAULT '',"
            "  created_by          TEXT DEFAULT '',"
            "  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,"
            "  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,"
            "  closed_at           TEXT DEFAULT ''"
            ")"
        )

        # ── Shifts ─────────────────────────────────────────────────────────────
        c.execute(
            "CREATE TABLE IF NOT EXISTS u_shift ("
            "  sys_id          TEXT PRIMARY KEY,"
            "  u_airport_id    TEXT DEFAULT 'SJC-01',"
            "  staff_username  TEXT NOT NULL,"
            "  role            TEXT NOT NULL,"
            "  shift_date      TEXT NOT NULL,"
            "  start_time      TEXT NOT NULL,"
            "  end_time        TEXT NOT NULL,"
            "  terminal        TEXT DEFAULT '',"
            "  status          TEXT DEFAULT 'scheduled',"
            "  handover_notes  TEXT DEFAULT '',"
            "  ai_summary      TEXT DEFAULT '',"
            "  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP"
            ")"
        )
        c.execute("SELECT COUNT(*) FROM u_shift")
        if c.fetchone()[0] == 0:
            import uuid as _su
            from datetime import date as _d
            _today = _d.today().isoformat()
            for _s in [
                (str(_su.uuid4()), "tech",        "technician",  "06:00", "14:00", "Terminal 1",   "active"),
                (str(_su.uuid4()), "electrician", "electrician", "06:00", "14:00", "Terminal 2",   "active"),
                (str(_su.uuid4()), "security",    "security",    "14:00", "22:00", "All Terminals","scheduled"),
                (str(_su.uuid4()), "plumber",     "plumber",     "06:00", "14:00", "Terminal 1",   "active"),
                (str(_su.uuid4()), "helpstaff",   "helpstaff",   "08:00", "16:00", "Terminal 2",   "active"),
            ]:
                c.execute(
                    "INSERT INTO u_shift (sys_id, u_airport_id, staff_username, role, shift_date, start_time, end_time, terminal, status) "
                    "VALUES (?, 'SJC-01', ?, ?, ?, ?, ?, ?, ?)",
                    (_s[0], _s[1], _s[2], _today, _s[3], _s[4], _s[5], _s[6])
                )

        # ── FIDS / Flights ─────────────────────────────────────────────────────
        c.execute(
            "CREATE TABLE IF NOT EXISTS u_flight ("
            "  sys_id          TEXT PRIMARY KEY,"
            "  u_airport_id    TEXT DEFAULT 'SJC-01',"
            "  flight_number   TEXT NOT NULL,"
            "  airline         TEXT DEFAULT '',"
            "  origin          TEXT DEFAULT '',"
            "  destination     TEXT DEFAULT '',"
            "  scheduled_dep   TEXT DEFAULT '',"
            "  scheduled_arr   TEXT DEFAULT '',"
            "  actual_dep      TEXT DEFAULT '',"
            "  actual_arr      TEXT DEFAULT '',"
            "  status          TEXT DEFAULT 'On Time',"
            "  gate            TEXT DEFAULT '',"
            "  terminal        TEXT DEFAULT '',"
            "  disruption_type TEXT DEFAULT '',"
            "  disruption_msg  TEXT DEFAULT '',"
            "  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP"
            ")"
        )
        c.execute("SELECT COUNT(*) FROM u_flight")
        if c.fetchone()[0] == 0:
            import uuid as _fu
            _flights = [
                ("AA101","American Airlines","JFK","SJC","08:00","11:30","On Time","A12","Terminal 1","",""),
                ("UA204","United Airlines","LAX","SJC","09:15","10:45","Delayed","B5","Terminal 2","Weather","Heavy fog causing 45-min delay"),
                ("DL330","Delta Air Lines","ORD","SJC","10:00","13:20","On Time","C3","Terminal 1","",""),
                ("SW412","Southwest Airlines","LAS","SJC","11:30","12:50","Cancelled","A7","Terminal 1","Mechanical","Aircraft mechanical issue — rebooking at counter A7"),
                ("AA567","American Airlines","DFW","SJC","12:45","15:30","Boarding","B9","Terminal 2","",""),
                ("UA789","United Airlines","SEA","SJC","14:00","16:10","On Time","C1","Terminal 1","",""),
                ("DL910","Delta Air Lines","ATL","SJC","15:20","19:45","Delayed","A3","Terminal 2","ATC","Air traffic control delay at origin"),
                ("SW234","Southwest Airlines","PHX","SJC","16:00","17:20","On Time","B2","Terminal 1","",""),
            ]
            for _f in _flights:
                c.execute(
                    "INSERT INTO u_flight (sys_id, flight_number, airline, origin, destination, scheduled_dep, scheduled_arr, status, gate, terminal, disruption_type, disruption_msg) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (str(_fu.uuid4()),) + _f
                )

        # ── SLA Breach Log ─────────────────────────────────────────────────────
        c.execute(
            "CREATE TABLE IF NOT EXISTS u_sla_breach_log ("
            "  id              INTEGER PRIMARY KEY AUTOINCREMENT,"
            "  u_airport_id    TEXT DEFAULT 'SJC-01',"
            "  incident_id     TEXT,"
            "  incident_number TEXT,"
            "  priority        TEXT,"
            "  sla_threshold   INTEGER,"
            "  breach_minutes  INTEGER,"
            "  team            TEXT,"
            "  timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP"
            ")"
        )

        conn.commit()
        print("[DB] SQLite initialized ->", DB_PATH)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# Asset helpers
# ══════════════════════════════════════════════════════════════════════════════

ALLOWED_ASSET_FIELDS = {
    "u_airport_id",
    "u_name",
    "u_type",
    "u_location",
    "u_terminal",
    "u_status",
    "u_last_serviced",
    "u_criticality",
    "notes",
}


def db_get_assets(airport_id: str = 'SJC-01') -> list[dict]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM u_airport_asset WHERE u_airport_id = ?", (airport_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def db_get_asset(sys_id: str) -> dict | None:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM u_airport_asset WHERE sys_id = ?", (sys_id,)
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
            INSERT OR IGNORE INTO u_airport_asset
            (sys_id, u_airport_id, u_name, u_type, u_location, u_terminal, u_status, u_last_serviced, notes)
            VALUES (:sys_id, :u_airport_id, :u_name, :u_type, :u_location, :u_terminal,
                    :u_status, :u_last_serviced, :notes)
        """,
            {
                "sys_id": payload.get("sys_id"),
                "u_airport_id": payload.get("u_airport_id", "SJC-01"),
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

    # Security: Whitelist validation for column names to prevent SQL injection
    for k in updates:
        if k not in ALLOWED_ASSET_FIELDS:
            raise ValueError(f"Invalid field: {k}")

    conn = get_connection()
    try:
        fields = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [sys_id]
        conn.execute(f"UPDATE u_airport_asset SET {fields} WHERE sys_id = ?", values)
        conn.commit()
        return db_get_asset(sys_id)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# Preventive task helpers
# ══════════════════════════════════════════════════════════════════════════════

ALLOWED_TASK_FIELDS = {
    "u_title",
    "u_asset_name",
    "u_assigned_team",
    "u_due_date",
    "u_frequency",
    "u_description",
    "u_status",
    "notes",
    "completed_date",
}


def db_get_tasks(airport_id: str = 'SJC-01') -> list[dict]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM u_preventive_task WHERE u_airport_id = ?", (airport_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def db_get_task(sys_id: str) -> dict | None:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM u_preventive_task WHERE sys_id = ?", (sys_id,)
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
            INSERT OR IGNORE INTO u_preventive_task
            (sys_id, u_airport_id, u_title, u_asset_name, u_assigned_team, u_due_date,
             u_frequency, u_description, u_status, notes, completed_date)
            VALUES (:sys_id,:u_airport_id,:u_title,:u_asset_name,:u_assigned_team,:u_due_date,
                    :u_frequency,:u_description,:u_status,:notes,:completed_date)
        """,
            {
                "sys_id": payload.get("sys_id"),
                "u_airport_id": payload.get("u_airport_id", "SJC-01"),
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

    # Security: Whitelist validation for column names to prevent SQL injection
    for k in updates:
        if k not in ALLOWED_TASK_FIELDS:
            raise ValueError(f"Invalid field: {k}")

    conn = get_connection()
    try:
        fields = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [sys_id]
        conn.execute(f"UPDATE u_preventive_task SET {fields} WHERE sys_id = ?", values)
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
        rows = conn.execute("SELECT * FROM u_qr_location").fetchall()
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
            INSERT OR IGNORE INTO u_qr_location (sys_id, u_airport_id, u_terminal, u_area, u_location_code)
            VALUES (:sys_id, :u_airport_id, :u_terminal, :u_area, :u_location_code)
        """,
            {
                "sys_id": payload.get("sys_id"),
                "u_airport_id": payload.get("u_airport_id", "SJC-01"),
                "u_terminal": payload.get("u_terminal", ""),
                "u_area": payload.get("u_area", ""),
                "u_location_code": payload.get("u_location_code", ""),
            },
        )
        conn.commit()
        return payload
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# IoT helpers
# ══════════════════════════════════════════════════════════════════════════════


def db_log_telemetry(asset_id: str, temp: float, vib: float, hum: float, status: str) -> None:
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO u_iot_sensor (u_airport_id, asset_id, temperature, vibration, humidity, status) VALUES ('SJC-01', ?, ?, ?, ?, ?)",
            (asset_id, temp, vib, hum, status),
        )
        conn.commit()
    finally:
        conn.close()


def db_get_telemetry(asset_id: str, limit: int = 10) -> list[dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM u_iot_sensor WHERE asset_id = ? ORDER BY timestamp DESC LIMIT ?",
            (asset_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# Work Order helpers
# ══════════════════════════════════════════════════════════════════════════════

ALLOWED_WO_FIELDS = {
    "title", "description", "assigned_team", "assigned_to", "priority",
    "status", "approval_status", "approved_by", "approval_notes",
    "technician_notes", "asset_id", "location", "sla_target",
    "sn_work_order_sys_id", "updated_at", "closed_at",
}


def db_get_work_orders(airport_id: str = "SJC-01", status: str = "", assigned_to: str = "") -> list[dict]:
    conn = get_connection()
    try:
        query = "SELECT * FROM u_work_order WHERE u_airport_id = ?"
        params: list = [airport_id]
        if status:
            query += " AND status = ?"
            params.append(status)
        if assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)
        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def db_get_work_order(sys_id: str) -> dict | None:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM u_work_order WHERE sys_id = ?", (sys_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def db_create_work_order(payload: dict) -> dict:
    import uuid
    payload.setdefault("sys_id", str(uuid.uuid4()))
    conn = get_connection()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO u_work_order "
            "(sys_id, u_airport_id, title, description, linked_incident_id, sn_incident_sys_id, "
            " assigned_team, assigned_to, priority, status, approval_status, asset_id, location, "
            " sla_target, created_by) "
            "VALUES (:sys_id, :u_airport_id, :title, :description, :linked_incident_id, :sn_incident_sys_id, "
            "        :assigned_team, :assigned_to, :priority, :status, :approval_status, :asset_id, "
            "        :location, :sla_target, :created_by)",
            {
                "sys_id": payload.get("sys_id"),
                "u_airport_id": payload.get("u_airport_id", "SJC-01"),
                "title": payload.get("title", ""),
                "description": payload.get("description", ""),
                "linked_incident_id": payload.get("linked_incident_id", ""),
                "sn_incident_sys_id": payload.get("sn_incident_sys_id", ""),
                "assigned_team": payload.get("assigned_team", ""),
                "assigned_to": payload.get("assigned_to", ""),
                "priority": payload.get("priority", "3"),
                "status": payload.get("status", "open"),
                "approval_status": payload.get("approval_status", "not_required"),
                "asset_id": payload.get("asset_id", ""),
                "location": payload.get("location", ""),
                "sla_target": payload.get("sla_target", ""),
                "created_by": payload.get("created_by", ""),
            }
        )
        conn.commit()
        return db_get_work_order(payload["sys_id"]) or payload
    finally:
        conn.close()


def db_update_work_order(sys_id: str, updates: dict) -> dict | None:
    if not updates:
        return db_get_work_order(sys_id)
    for k in updates:
        if k not in ALLOWED_WO_FIELDS:
            raise ValueError(f"Invalid field: {k}")
    conn = get_connection()
    try:
        updates["updated_at"] = __import__("datetime").datetime.now().isoformat()
        fields = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [sys_id]
        conn.execute(f"UPDATE u_work_order SET {fields} WHERE sys_id = ?", values)
        conn.commit()
        return db_get_work_order(sys_id)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# Shift helpers
# ══════════════════════════════════════════════════════════════════════════════


def db_get_shifts(airport_id: str = "SJC-01", shift_date: str = "") -> list[dict]:
    conn = get_connection()
    try:
        if shift_date:
            rows = conn.execute(
                "SELECT * FROM u_shift WHERE u_airport_id = ? AND shift_date = ? ORDER BY start_time",
                (airport_id, shift_date)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM u_shift WHERE u_airport_id = ? ORDER BY shift_date DESC, start_time",
                (airport_id,)
            ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def db_create_shift(payload: dict) -> dict:
    import uuid
    payload.setdefault("sys_id", str(uuid.uuid4()))
    conn = get_connection()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO u_shift "
            "(sys_id, u_airport_id, staff_username, role, shift_date, start_time, end_time, terminal, status) "
            "VALUES (:sys_id, :u_airport_id, :staff_username, :role, :shift_date, :start_time, :end_time, :terminal, :status)",
            {
                "sys_id": payload.get("sys_id"),
                "u_airport_id": payload.get("u_airport_id", "SJC-01"),
                "staff_username": payload.get("staff_username", ""),
                "role": payload.get("role", ""),
                "shift_date": payload.get("shift_date", ""),
                "start_time": payload.get("start_time", ""),
                "end_time": payload.get("end_time", ""),
                "terminal": payload.get("terminal", ""),
                "status": payload.get("status", "scheduled"),
            }
        )
        conn.commit()
        conn2 = get_connection()
        row = conn2.execute("SELECT * FROM u_shift WHERE sys_id = ?", (payload["sys_id"],)).fetchone()
        conn2.close()
        return dict(row) if row else payload
    finally:
        conn.close()


def db_update_shift(sys_id: str, updates: dict) -> dict | None:
    allowed = {"status", "handover_notes", "ai_summary"}
    conn = get_connection()
    try:
        safe = {k: v for k, v in updates.items() if k in allowed}
        if safe:
            fields = ", ".join(f"{k} = ?" for k in safe)
            conn.execute(f"UPDATE u_shift SET {fields} WHERE sys_id = ?", list(safe.values()) + [sys_id])
            conn.commit()
        row = conn.execute("SELECT * FROM u_shift WHERE sys_id = ?", (sys_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# Flight / FIDS helpers
# ══════════════════════════════════════════════════════════════════════════════


def db_get_flights(airport_id: str = "SJC-01", status: str = "") -> list[dict]:
    conn = get_connection()
    try:
        if status:
            rows = conn.execute(
                "SELECT * FROM u_flight WHERE u_airport_id = ? AND status = ? ORDER BY scheduled_dep",
                (airport_id, status)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM u_flight WHERE u_airport_id = ? ORDER BY scheduled_dep",
                (airport_id,)
            ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def db_update_flight(sys_id: str, updates: dict) -> dict | None:
    allowed = {"status", "actual_dep", "actual_arr", "gate", "disruption_type", "disruption_msg", "updated_at"}
    conn = get_connection()
    try:
        safe = {k: v for k, v in updates.items() if k in allowed}
        safe["updated_at"] = __import__("datetime").datetime.now().isoformat()
        fields = ", ".join(f"{k} = ?" for k in safe)
        conn.execute(f"UPDATE u_flight SET {fields} WHERE sys_id = ?", list(safe.values()) + [sys_id])
        conn.commit()
        row = conn.execute("SELECT * FROM u_flight WHERE sys_id = ?", (sys_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# Audit log query helpers
# ══════════════════════════════════════════════════════════════════════════════


def db_get_audit_logs(airport_id: str = "SJC-01", actor: str = "", action: str = "", limit: int = 100) -> list[dict]:
    conn = get_connection()
    try:
        query = "SELECT * FROM u_audit_log WHERE u_airport_id = ?"
        params: list = [airport_id]
        if actor:
            query += " AND actor LIKE ?"
            params.append(f"%{actor}%")
        if action:
            query += " AND action LIKE ?"
            params.append(f"%{action}%")
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def db_log_sla_breach(airport_id: str, incident_id: str, incident_number: str,
                      priority: str, sla_threshold: int, breach_minutes: int, team: str) -> None:
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO u_sla_breach_log (u_airport_id, incident_id, incident_number, priority, sla_threshold, breach_minutes, team) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (airport_id, incident_id, incident_number, priority, sla_threshold, breach_minutes, team)
        )
        conn.commit()
    finally:
        conn.close()

