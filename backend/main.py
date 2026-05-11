from contextlib import asynccontextmanager

import database
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (ai, assets, auth, incidents, notifications, preventive,
                     qrcode_router, technician, iot)

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize SQLite fallback DB on startup."""
    database.init_db()
    yield


app = FastAPI(
    title="Smart Airport Management API",
    description="AI-Powered Airport Operations Platform — FastAPI backend with ServiceNow, Groq AI triage, WhatsApp/Email notifications, and SQLite fallback persistence.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081", # Metro bundler
        "http://localhost:19006", # Expo web
        "https://smart-airport.vercel.app", # Placeholder prod URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(preventive.router, prefix="/api/preventive", tags=["Preventive"])
app.include_router(technician.router, prefix="/api/technician", tags=["Technician"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(notifications.router, prefix="/api/notify", tags=["Notifications"])
app.include_router(qrcode_router.router, prefix="/api/qr", tags=["QR Code"])
app.include_router(iot.router, prefix="/api/iot", tags=["IoT"])


@app.get("/")
def root():
    return {
        "app": "Smart Airport Management",
        "status": "running",
        "version": "2.0.0",
        "docs": "/docs",
        "auth": "JWT Bearer — POST /api/auth/login",
    }


@app.get("/health")
def health():
    """Health check endpoint for load balancers and uptime monitors."""
    return {"status": "healthy", "service": "smart-airport-api", "version": "2.0.0"}
