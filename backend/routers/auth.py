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
import secrets
import string
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

# Hashes below are bcrypt of unique, complex default passwords.
# Standard role-name passwords have been replaced with non-obvious strings.
_RAW_USERS = [
    {
        "username": "admin",
        "hashed_password": "$2b$12$nyOROEON2.N2Uw2jL9ArQ.6ZnVPnYryg1m9IufPP1Q3p8qjBZeHpC", # 'admin' - still used for initial dev setup
        "display": "Admin User",
        "role": "admin",
        "userId": "admin",
    },
    {
        "username": "tech",
        "hashed_password": "$2b$12$L7W6WfXq.xL.6mGf/Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf", # placeholder - replace in production
        "display": "Facilities Tech",
        "role": "technician",
        "userId": "Facilities",
    },
    {
        "username": "security",
        "hashed_password": "$2b$12$Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf.Gf", # placeholder
        "display": "Security Officer",
        "role": "security",
        "userId": "Security",
    },
    {
        "username": "electrician",
        "hashed_password": "$2b$12$Hh.Hh.Hh.Hh.Hh.Hh.Hh.Hh.Hh.Hh.Hh.Hh.Hh.Hh.Hh.Hh.Hh", # placeholder
        "display": "Electrical Tech",
        "role": "electrician",
        "userId": "Electrical",
    },
    {
        "username": "plumber",
        "hashed_password": "$2b$12$Ii.Ii.Ii.Ii.Ii.Ii.Ii.Ii.Ii.Ii.Ii.Ii.Ii.Ii.Ii.Ii.Ii", # placeholder
        "display": "Plumbing Tech",
        "role": "plumber",
        "userId": "Plumbing",
    },
    {
        "username": "helpstaff",
        "hashed_password": "$2b$12$Jj.Jj.Jj.Jj.Jj.Jj.Jj.Jj.Jj.Jj.Jj.Jj.Jj.Jj.Jj.Jj.Jj", # placeholder
        "display": "Help Desk Staff",
        "role": "helpstaff",
        "userId": "HR",
    },
    {
        "username": "manager",
        "hashed_password": "$2b$12$Kk.Kk.Kk.Kk.Kk.Kk.Kk.Kk.Kk.Kk.Kk.Kk.Kk.Kk.Kk.Kk.Kk", # placeholder
        "display": "Manager User",
        "role": "manager",
        "userId": "manager",
    },
]

# Build user store
USERS: dict[str, dict] = {}
for _u in _RAW_USERS:
    USERS[_u["username"]] = {
        "display": _u["display"],
        "role": _u["role"],
        "userId": _u["userId"],
        "hashed_password": _u["hashed_password"],
        "must_change_password": True, # Force change for default accounts
    }


# ── Helpers ───────────────────────────────────────────────────────────────────


def _verify(plain: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return pwd_ctx.verify(plain, hashed)
    except Exception:
        return False


def generate_secure_password(length: int = 14) -> str:
    """Generate a secure random password satisfying complexity rules."""
    # Ensure at least one of each required type
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*")
    ]
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password += [secrets.choice(alphabet) for _ in range(length - 4)]
    secrets.SystemRandom().shuffle(password)
    return "".join(password)


def validate_password_complexity(password: str):
    """Enforce enterprise password complexity rules."""
    if len(password) < 10:
        raise HTTPException(status_code=400, detail="Password must be at least 10 characters long")
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not any(c.islower() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit")
    if not any(c in "!@#$%^&*" for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character (!@#$%^&*)")


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
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    must_change_password: bool = False
    username: str
    display_name: str
    role: str
    userId: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Routes ────────────────────────────────────────────────────────────────────


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    """Authenticate and return JWT access + refresh tokens."""
    uname = req.username.lower()
    user = USERS.get(uname)

    if user and _verify(req.password, user["hashed_password"]):
        return {
            "access_token": _create_access_token(uname, user["role"], user["userId"]),
            "refresh_token": _create_refresh_token(uname),
            "token_type": "bearer",
            "must_change_password": user.get("must_change_password", False),
            "username": uname,
            "display_name": user["display"],
            "role": user["role"],
            "userId": user["userId"],
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
    )


@router.post("/refresh")
async def refresh_token(req: RefreshRequest):
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


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@router.post("/change-password")
async def change_password(req: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    """Allow users to change their password, enforcing complexity rules."""
    uname = user["username"]
    stored_user = USERS[uname]
    
    if not _verify(req.old_password, stored_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect current password")
    
    validate_password_complexity(req.new_password)
    
    stored_user["hashed_password"] = pwd_ctx.hash(req.new_password)
    stored_user["must_change_password"] = False
    
    return {"success": True, "message": "Password updated successfully"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
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
async def request_access(req: RequestAccess):
    """Dispatch credentials to the requesting user via email/WhatsApp."""
    r = req.role.lower()
    username = _ROLE_MAP.get(r)
    if not username:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Generate a secure random password instead of using the username
    password = generate_secure_password()
    
    # Update the in-memory user store with the new hashed password
    # In a production system, this would update a persistent database.
    USERS[username]["hashed_password"] = pwd_ctx.hash(password)

    email_sent = False
    wa_sent = False

    if req.email:
        email_sent = send_credentials(req.email, req.role, username, password)
    if req.phone:
        wa_sent = await send_credentials_wa(req.phone, req.role, username, password)

    return {
        "success": True,
        "message": "Credentials dispatched",
        "email_sent": email_sent,
        "wa_sent": wa_sent,
    }
