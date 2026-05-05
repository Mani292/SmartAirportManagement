#!/bin/bash
# SmartAirportManagement — Backend Start Script
# Activates venv and starts uvicorn with hot-reload

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt -q

echo "Starting FastAPI backend on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
