import pytest
import os
from backend.database import db_update_asset, db_update_task, init_db, get_connection, DB_PATH

@pytest.fixture(autouse=True)
def setup_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    init_db()

def test_db_update_asset_valid():
    asset = db_update_asset('mock_asset_1', {'u_status': 'maintenance', 'notes': 'Service required'})
    assert asset['u_status'] == 'maintenance'
    assert asset['notes'] == 'Service required'

def test_db_update_asset_invalid_field():
    with pytest.raises(ValueError) as excinfo:
        db_update_asset('mock_asset_1', {'invalid_field': 'value'})
    assert "Invalid field: invalid_field" in str(excinfo.value)

def test_db_update_asset_injection_attempt():
    with pytest.raises(ValueError):
        db_update_asset('mock_asset_1', {"u_status = 'injected', u_name": 'Exploited'})

    # Verify no change occurred
    conn = get_connection()
    row = conn.execute("SELECT u_status FROM fallback_assets WHERE sys_id = 'mock_asset_1'").fetchone()
    conn.close()
    assert row['u_status'] == 'operational'

def test_db_update_task_valid():
    task = db_update_task('mock_prev_1', {'u_status': 'completed', 'completed_date': '2026-05-01'})
    assert task['u_status'] == 'completed'
    assert task['completed_date'] == '2026-05-01'

def test_db_update_task_invalid_field():
    with pytest.raises(ValueError) as excinfo:
        db_update_task('mock_prev_1', {'non_existent': 'value'})
    assert "Invalid field: non_existent" in str(excinfo.value)

def test_db_update_task_injection_attempt():
    with pytest.raises(ValueError):
        db_update_task('mock_prev_1', {"u_status = 'injected', u_title": 'Exploited'})

    # Verify no change occurred
    conn = get_connection()
    row = conn.execute("SELECT u_status FROM fallback_tasks WHERE sys_id = 'mock_prev_1'").fetchone()
    conn.close()
    assert row['u_status'] == 'scheduled'
