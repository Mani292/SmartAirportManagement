import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import incidents, assets, preventive, technician, ai, notifications, qrcode_router, auth

load_dotenv()

app = FastAPI(
    title="Smart Airport Management API",
    description="AI-Powered Airport Operations Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api/auth",       tags=["Auth"])
app.include_router(incidents.router,     prefix="/api/incidents",  tags=["Incidents"])
app.include_router(assets.router,        prefix="/api/assets",     tags=["Assets"])
app.include_router(preventive.router,    prefix="/api/preventive", tags=["Preventive"])
app.include_router(technician.router,    prefix="/api/technician", tags=["Technician"])
app.include_router(ai.router,            prefix="/api/ai",         tags=["AI"])
app.include_router(notifications.router, prefix="/api/notify",     tags=["Notifications"])
app.include_router(qrcode_router.router, prefix="/api/qr",         tags=["QR Code"])

@app.get("/")
def root():
    return {
        "app": "Smart Airport Management",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    """Health check endpoint for load balancers and uptime monitors."""
    return {"status": "healthy", "service": "smart-airport-api"}