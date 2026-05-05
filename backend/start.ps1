# Smart Airport Management - Backend Startup Script
# Run this from the backend/ directory

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Smart Airport Management - Backend" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$venvPython = Join-Path $scriptDir "venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "[ERROR] venv not found. Run: python -m venv venv && venv\Scripts\pip install -r requirements.txt" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Using venv Python: $venvPython" -ForegroundColor Green
Write-Host "[OK] Starting FastAPI on http://0.0.0.0:8000 ..." -ForegroundColor Green
Write-Host ""

& $venvPython -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
