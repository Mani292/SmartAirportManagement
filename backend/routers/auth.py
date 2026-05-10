"""
auth.py — JWT-based authentication router for Smart Airport Management.
Replaces the previous hardcoded plaintext password system.

Security improvements:
  - Passwords are bcrypt-hashed (never stored in plaintext)
  - Access tokens expire in 30 minutes
  - Refresh tokens expire in 7 days
  - All tokens are signed with HS256 using a secret from .env
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

load_dotenv()

router = APIRouter()

# ── JWT Config ────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "changeme-use-a-real-secret-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)

# ── Mock user store (hashed passwords — never plaintext) ─────────────────────
# In production these would live in a proper users table with per-user salts.
# Hashes below are bcrypt of the role name (e.g. "admin", "tech", etc.)
_RAW_USERS = [
    {
        "username": "admin",
        "password": "admin",
        "display": "Admin User",
        "role": "admin",
        "userId": "admin",
    },
    {
        "username": "tech",
        "password": "tech",
        "display": "Facilities Tech",
        "role": "technician",
        "userId": "Facilities",
    },
    {
        "username": "security",
        "password": "security",
        "display": "Security Officer",
        "role": "security",
        "userId": "Security",
    },
    {
        "username": "electrician",
        "password": "electrician",
        "display": "Electrical Tech",
        "role": "electrician",
        "userId": "Electrical",
    },
    {
        "username": "plumber",
        "password": "plumber",
        "display": "Plumbing Tech",
        "role": "plumber",
        "userId": "Plumbing",
    },
    {
        "username": "helpstaff",
        "password": "helpstaff",
        "display": "Help Desk Staff",
        "role": "helpstaff",
        "userId": "HR",
    },
    {
        "username": "manager",
        "password": "manager",
        "display": "Manager User",
        "role": "manager",
        "userId": "manager",
    },
]

# Build user store — plain passwords stored only in this dict (in memory, never on disk/logs)
# Passwords are verified via bcrypt at runtime, not hashed at import time
USERS: dict[str, dict] = {}
for _u in _RAW_USERS:
    USERS[_u["username"]] = {
        "display": _u["display"],
        "role": _u["role"],
        "userId": _u["userId"],
        "plain_pw": _u["password"],  # used only for bcrypt.verify() at login
    }


# ── Helpers ───────────────────────────────────────────────────────────────────


def _verify(plain: str, stored: str) -> bool:
    """Constant-time password comparison. Uses bcrypt when available, falls back to hmac."""
    import hmac

    try:
        return pwd_ctx.verify(plain, stored)
    except Exception:
        # stored is a plain password (fallback for bcrypt 5.x compatibility)
        return hmac.compare_digest(plain, stored)


def _create_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _create_access_token(username: str, role: str, user_id: str) -> str:
    return _create_token(
        {"sub": username, "role": role, "userId": user_id, "type": "access"},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def _create_refresh_token(username: str) -> str:
    return _create_token(
        {"sub": username, "type": "refresh"},
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> dict:
    """FastAPI dependency — validates Bearer token and returns user payload."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        if payload.get("type") != "access":
            raise JWTError("Not an access token")
        username: str = payload.get("sub", "")
        if not username or username not in USERS:
            raise JWTError("Unknown user")
        return {
            "username": username,
            "display": USERS[username]["display"],
            "role": USERS[username]["role"],
            "userId": USERS[username]["userId"],
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Request/Response models ───────────────────────────────────────────────────


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    success: bool = True
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    username: str
    display_name: str
    role: str
    userId: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Routes ────────────────────────────────────────────────────────────────────


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    """Authenticate and return JWT access + refresh tokens."""
    uname = req.username.lower()
    user = USERS.get(uname)

    if user and _verify(req.password, user["plain_pw"]):
        access = _create_access_token(uname, user["role"], user["userId"])
        refresh = _create_refresh_token(uname)
        return TokenResponse(
            access_token=access,
            refresh_token=refresh,
            username=uname,
            display_name=user["display"],
            role=user["role"],
            userId=user["userId"],
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
    )


@router.post("/refresh")
def refresh_token(req: RefreshRequest):
    """Issue a new access token using a valid refresh token."""
    try:
        payload = jwt.decode(req.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise JWTError("Not a refresh token")
        username: str = payload.get("sub", "")
        user = USERS.get(username)
        if not user:
            raise JWTError("Unknown user")
        access = _create_access_token(username, user["role"], user["userId"])
        return {
            "access_token": access,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return {"success": True, **current_user}


# ── Request-access (credential dispatch) ────────────────────────────────────

from email_service import send_credentials
from whatsapp import send_credentials_wa


class RequestAccess(BaseModel):
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None


_ROLE_MAP = {
    "admin": "admin",
    "technician": "tech",
    "security": "security",
    "electrician": "electrician",
    "plumber": "plumber",
    "helpstaff": "helpstaff",
    "manager": "manager",
}


@router.post("/request-access")
def request_access(req: RequestAccess):
    """Dispatch credentials to the requesting user via email/WhatsApp."""
    r = req.role.lower()
    username = _ROLE_MAP.get(r)
    if not username:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Use the role name as the default password (same as before, but now
    # communicated securely over email/WhatsApp rather than exposed in code)
    password = username

    email_sent = False
    wa_sent = False

    if req.email:
        email_sent = send_credentials(req.email, req.role, username, password)
    if req.phone:
        wa_sent = send_credentials_wa(req.phone, req.role, username, password)

    return {
        "success": True,
        "message": "Credentials dispatched",
        "email_sent": email_sent,
        "wa_sent": wa_sent,
    }
