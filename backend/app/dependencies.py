"""FastAPI dependency that resolves the authenticated user from a JWT.

Tokens are read from an HTTP-only cookie (`ps_access_token`), falling back to
an `Authorization: Bearer` header for API clients. Returns None when no valid
token is present (so public routes can optionally use it).
"""

from __future__ import annotations

from typing import Optional

from fastapi import Depends, Header, HTTPException, Request, status

from .config import settings
from .services.auth_service import auth_service
from .services.security import decode_token

ACCESS_COOKIE = "ps_access_token"
REFRESH_COOKIE = "ps_refresh_token"


def _token_from(request: Request, authorization: Optional[str]) -> Optional[str]:
    token = request.cookies.get(ACCESS_COOKIE)
    if token:
        return token
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:]
    return None


async def get_current_user(request: Request, authorization: Optional[str] = Header(default=None)):
    token = _token_from(request, authorization)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = await auth_service.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_optional_user(request: Request, authorization: Optional[str] = Header(default=None)):
    token = _token_from(request, authorization)
    if not token:
        return None
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    return await auth_service.get_user_by_id(payload["sub"])


async def get_admin_user(request: Request, authorization: Optional[str] = Header(default=None)):
    """Resolve the current user and require admin privileges (403 otherwise)."""
    token = _token_from(request, authorization)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = await auth_service.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.get("email", "").lower() not in settings.admin_emails_set:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def set_auth_cookies(response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
    ACCESS_COOKIE,
    access_token,
    httponly=True,
    secure=True,
    samesite="none",
    path="/",
    max_age=60 * 60 * 24 * 30,
)
    response.set_cookie(
    REFRESH_COOKIE,
    refresh_token,
    httponly=True,
    secure=True,
    samesite="none",
    path="/",
    max_age=60 * 60 * 24 * 30,
)


def clear_auth_cookies(response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/")
