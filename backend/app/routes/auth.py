"""Authentication routes.

All tokens are returned via HTTP-only cookies AND in the JSON body (so API
clients without cookie support still work). The frontend uses the cookie
path so login persists across refreshes without exposing tokens to JS.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from ..dependencies import clear_auth_cookies, get_current_user, set_auth_cookies
from ..models.auth import (
    ForgotPasswordRequest,
    MessageResponse,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserOut,
    VerifyEmailRequest,
)
from ..services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserCreate, response: Response):
    try:
        user, _ = await auth_service.register(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    tokens = await auth_service.login(payload.email, payload.password)
    set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        user=tokens["user"],
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, response: Response):
    try:
        tokens = await auth_service.login(payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        user=tokens["user"],
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, response: Response):
    try:
        tokens = await auth_service.refresh(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        user=tokens["user"],
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(request: Request, response: Response):
    token = request.cookies.get("ps_access_token")
    from ..services.security import decode_token

    payload = decode_token(token) if token else None
    if payload:
        await auth_service.logout(payload["sub"])
    clear_auth_cookies(response)
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return UserOut(
        id=user["id"], name=user["name"], email=user["email"],
        email_verified=user.get("email_verified", False),
        is_admin=user.get("email", "").lower() in settings.admin_emails_set,
    )


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(payload: VerifyEmailRequest):
    ok = await auth_service.verify_email(payload.token)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    return MessageResponse(message="Email verified")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(user=Depends(get_current_user)):
    ok, message = await auth_service.resend_verification(user["id"])
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return MessageResponse(message=message)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest):
    await auth_service.request_password_reset(payload.email)
    return MessageResponse(message="If that email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest):
    ok = await auth_service.reset_password(payload.token, payload.password)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    return MessageResponse(message="Password reset")
