from contextlib import asynccontextmanager
import os

import database
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from routers import (ai, assets, auth, incidents, notifications, preventive,
                     qrcode_router, technician, iot, metrics, ws)

load_dotenv()

# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize SQLite fallback DB on startup."""
    database.init_db()
    yield


app = FastAPI(
    title="Smart Airport Management API",
    description=(
        "**Enterprise-Grade AI-Powered Airport Operations Platform.**\n\n"
        "Integrates **ServiceNow CMDB**, **Groq LLM** triage, **IoT anomaly detection**, "
        "WhatsApp/Email notifications, and an offline-capable React Native mobile app.\n\n"
        "**Problem Statement**: Airports suffer from inefficient manual triage, "
        "reactive maintenance, and disconnected field staff. This system bridges "
        "passengers, IoT sensors, and field technicians via an AI-orchestrated, "
        "mobile-first, multi-tenant airport operations ecosystem."
    ),
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Rate Limit Handler ────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── Global Error Handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions to return a clean JSON response."""
    print(f"[FATAL] Global Error Catch: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal Server Error",
            "detail": str(exc) if os.getenv("DEBUG") == "true" else "An unexpected error occurred."
        }
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",   # Metro bundler
        "http://localhost:19006",  # Expo web
        "https://smart-airport.vercel.app",
        os.getenv("FRONTEND_URL", ""),  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Append enterprise security headers to every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ── API Versioning (v1) ────────────────────────────────────────────────────────
API_V1 = "/api/v1"

app.include_router(auth.router, prefix=f"{API_V1}/auth", tags=["Auth"])
app.include_router(incidents.router, prefix=f"{API_V1}/incidents", tags=["Incidents"])
app.include_router(assets.router, prefix=f"{API_V1}/assets", tags=["Assets"])
app.include_router(preventive.router, prefix=f"{API_V1}/preventive", tags=["Preventive"])
app.include_router(technician.router, prefix=f"{API_V1}/technician", tags=["Technician"])
app.include_router(ai.router, prefix=f"{API_V1}/ai", tags=["AI"])
app.include_router(notifications.router, prefix=f"{API_V1}/notify", tags=["Notifications"])
app.include_router(qrcode_router.router, prefix=f"{API_V1}/qr", tags=["QR Code"])
app.include_router(iot.router, prefix=f"{API_V1}/iot", tags=["IoT"])
app.include_router(metrics.router, prefix=f"{API_V1}/metrics", tags=["Metrics"])
app.include_router(ws.router, tags=["WebSockets"])


@app.get("/")
def root():
    return {
        "app": "Smart Airport Management",
        "status": "running",
        "version": "2.1.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "auth": "JWT Bearer — POST /api/v1/auth/login",
        "problem_statement": "Bridging passengers, IoT sensors, and field staff via AI-orchestrated airport ops.",
    }


@app.get("/health")
def health():
    """Health check endpoint for load balancers and uptime monitors."""
    return {"status": "healthy", "service": "smart-airport-api", "version": "2.1.0"}
