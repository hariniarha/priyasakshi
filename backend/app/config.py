"""Application configuration loaded from environment variables.

Uses pydantic-settings for typed, validated config with `.env` file support.
Keep this file the *only* place that reads `os.environ` — everything else
should depend on the `settings` object.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Typed settings container."""

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- Database ----
    mongo_url: str = Field(..., alias="MONGO_URL")
    db_name: str = Field("priya_sakshi", alias="DB_NAME")

    # ---- CORS ----
    cors_origins: str = Field("*", alias="CORS_ORIGINS")

    # ---- Branding ----
    brand_name: str = Field("Priya Sakshi", alias="BRAND_NAME")
    brand_from_email: str = Field("hello@priyasakshi.com", alias="BRAND_FROM_EMAIL")
    contact_to_email: str = Field("arunbabuceg@gmail.com", alias="CONTACT_TO_EMAIL")
    frontend_url: str = Field("http://localhost:3000", alias="FRONTEND_URL")

    # ---- Email (Titan SMTP) ----
    smtp_host: str = Field("smtp.titan.email", alias="SMTP_HOST")
    smtp_port: int = Field(587, alias="SMTP_PORT")
    smtp_user: str = Field("", alias="SMTP_USER")
    smtp_pass: str = Field("", alias="SMTP_PASS")

    # ---- Resend ----
    resend_api_key: str = Field("", alias="RESEND_API_KEY")

    # ---- Payments (Razorpay) ----
    razorpay_key_id: str = Field("", alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str = Field("", alias="RAZORPAY_KEY_SECRET")

    # ---- Auth (JWT) ----
    jwt_secret: str = Field("change-me-in-production", alias="JWT_SECRET")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        60 * 24, alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    refresh_token_expire_days: int = Field(
        30, alias="REFRESH_TOKEN_EXPIRE_DAYS"
    )
    verification_token_expire_hours: int = Field(
        24, alias="VERIFICATION_TOKEN_EXPIRE_HOURS"
    )
    password_reset_token_expire_hours: int = Field(
        1, alias="PASSWORD_RESET_TOKEN_EXPIRE_HOURS"
    )

    # ---- Admin ----
    # Comma-separated allowlist of admin email addresses (lower-cased).
    admin_emails: str = Field(
        "arunbabuceg@gmail.com,admin@priyasakshi.com",
        alias="ADMIN_EMAILS",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        raw = (self.cors_origins or "").strip()
        if not raw or raw == "*":
            return ["*"]
        return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]

    @property
    def allow_credentials(self) -> bool:
        return self.cors_origins_list != ["*"]

    @property
    def admin_emails_set(self) -> set[str]:
        return {
            e.strip().lower()
            for e in (self.admin_emails or "").split(",")
            if e.strip()
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
