"""Authentication service — user persistence + token issuance.

Users live in the MongoDB `users` collection (password hashed with bcrypt).
Verification and password-reset tokens are signed JWTs (stateless) so we don't
need a separate token store.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from ..config import settings
from ..db import get_db, serialize_doc
from ..models.auth import UserCreate, UserOut
from . import security
from .email_service import email_service

logger = logging.getLogger("priya_sakshi.auth")


class AuthService:
    async def _user_by_email(self, email: str) -> Optional[dict]:
        return await get_db().users.find_one({"email": email.lower()})

    async def register(self, payload: UserCreate) -> tuple[dict, str]:
        existing = await self._user_by_email(payload.email)
        if existing:
            raise ValueError("An account with this email already exists")

        user = {
            "id": str(uuid.uuid4()),
            "name": payload.name,
            "email": payload.email.lower(),
            "password_hash": security.hash_password(payload.password),
            "email_verified": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await get_db().users.insert_one(user)
        logger.info("User registered id=%s email=%s", user["id"], user["email"])

        token = security._create_token(
            user["id"],
            timedelta(hours=settings.verification_token_expire_hours),
            "verify_email",
        )
        await email_service.send_email_verification(user["email"], token)
        return user, token

    async def login(self, email: str, password: str) -> dict:
        user = await self._user_by_email(email)
        if not user or not security.verify_password(password, user["password_hash"]):
            raise ValueError("Invalid email or password")

        access = security.create_access_token(user["id"])
        refresh = security.create_refresh_token(user["id"])
        await get_db().users.update_one(
            {"id": user["id"]},
            {"$set": {"refresh_token": refresh, "last_login": datetime.now(timezone.utc).isoformat()}},
        )
        return {
            "access_token": access,
            "refresh_token": refresh,
            "user": self._user_out(user),
        }

    async def refresh(self, refresh_token: str) -> dict:
        payload = security.decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")
        user = await get_db().users.find_one({"id": payload["sub"]})
        if not user:
            raise ValueError("User not found")
        access = security.create_access_token(user["id"])
        return {
            "access_token": access,
            "refresh_token": refresh_token,
            "user": self._user_out(user),
        }

    async def logout(self, user_id: str) -> None:
        await get_db().users.update_one({"id": user_id}, {"$unset": {"refresh_token": ""}})

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        return serialize_doc(await get_db().users.find_one({"id": user_id}))

    async def update_profile(self, user_id: str, name: Optional[str] = None, phone: Optional[str] = None) -> Optional[dict]:
        update_fields: dict = {}
        if name is not None:
            update_fields["name"] = name
        if phone is not None:
            update_fields["phone"] = phone
        if not update_fields:
            return await self.get_user_by_id(user_id)
        await get_db().users.update_one({"id": user_id}, {"$set": update_fields})
        return await self.get_user_by_id(user_id)

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        user = await self.get_user_by_id(user_id)
        if not user or not security.verify_password(current_password, user["password_hash"]):
            raise ValueError("Current password is incorrect")
        await get_db().users.update_one(
            {"id": user_id},
            {"$set": {"password_hash": security.hash_password(new_password)}},
        )
        return True

    async def verify_email(self, token: str) -> bool:
        payload = security.decode_token(token)
        if not payload or payload.get("type") != "verify_email":
            return False
        res = await get_db().users.update_one(
            {"id": payload["sub"]}, {"$set": {"email_verified": True}}
        )
        return res.modified_count > 0

    async def resend_verification(self, user_id: str) -> tuple[bool, str]:
        user = await self.get_user_by_id(user_id)
        if not user:
            return False, "User not found"
        if user.get("email_verified", False):
            return True, "Email already verified"
        token = security._create_token(
            user["id"],
            timedelta(hours=settings.verification_token_expire_hours),
            "verify_email",
        )
        await email_service.send_email_verification(user["email"], token)
        return True, "Verification email sent"

    async def request_password_reset(self, email: str) -> bool:
        user = await self._user_by_email(email)
        if not user:
            return False
        token = security._create_token(
            user["id"],
            timedelta(hours=settings.password_reset_token_expire_hours),
            "password_reset",
        )
        await email_service.send_password_reset(user["email"], token)
        return True

    async def reset_password(self, token: str, new_password: str) -> bool:
        payload = security.decode_token(token)
        if not payload or payload.get("type") != "password_reset":
            return False
        res = await get_db().users.update_one(
            {"id": payload["sub"]},
            {"$set": {"password_hash": security.hash_password(new_password)}},
        )
        return res.modified_count > 0

    @staticmethod
    def _user_out(user: dict) -> UserOut:
        return UserOut(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            email_verified=user.get("email_verified", False),
        )


auth_service = AuthService()
