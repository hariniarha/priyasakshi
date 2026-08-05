"""Email service — Resend integration.

Sends transactional email (newsletter welcome, contact notifications, order
confirmations, email verification, password reset) via the Resend API.
The API key comes from the environment variable RESEND_API_KEY and is never
hard-coded.

If Resend is not configured (no RESEND_API_KEY), calls are logged and
become no-ops so the rest of the app keeps working during local development.
"""

from __future__ import annotations

import logging
from typing import Optional

import resend

from ..config import settings

logger = logging.getLogger("priya_sakshi.email")


class EmailService:
    def __init__(self) -> None:
        self._enabled = bool(settings.resend_api_key)

        if self._enabled:
            resend.api_key = settings.resend_api_key
            logger.info("Resend email service initialised")
        else:
            logger.info("Email service disabled (RESEND_API_KEY missing)")

    async def _send(self, to: str | list[str], subject: str, html: str) -> None:
        if not self._enabled:
            logger.info("[email disabled] to=%s subject=%s", to, subject)
            return

        recipients = [to] if isinstance(to, str) else to

        try:
            params: resend.Emails.SendParams = {
                "from": f"{settings.brand_name} <{settings.brand_from_email}>",
                "to": recipients,
                "subject": subject,
                "html": html,
            }

            response = resend.Emails.send(params)

            logger.info(
                "Email sent successfully to=%s response=%s",
                recipients,
                response,
            )

        except Exception as exc:
            logger.exception("Failed to send email: %s", exc)

    # -------- public API --------
    async def send_newsletter_welcome(self, email: str, name: Optional[str]) -> None:
        greeting = f"Hello {name}" if name else "Hello"
        html = (
            f"<div style='font-family:Outfit,Arial,sans-serif;max-width:560px;margin:auto'>"
            f"<p>{greeting},</p>"
            f"<p>Welcome to <strong>{settings.brand_name}</strong>. We'll send you slow "
            f"letters about new arrivals, herbal rituals and stories from our looms.</p>"
            f"<p>— Priya Sakshi</p></div>"
        )
        await self._send(email, f"Welcome to {settings.brand_name}", html)

    async def send_contact_notification(self, name: str, email: str, message: str) -> None:
        from datetime import datetime, timezone

        when = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        html = (
            f"<div style='font-family:Outfit,Arial,sans-serif;max-width:560px;margin:auto'>"
            f"<h2>New contact message</h2>"
            f"<p><strong>Name:</strong> {name}</p>"
            f"<p><strong>Email:</strong> {email}</p>"
            f"<p><strong>Date &amp; Time:</strong> {when}</p>"
            f"<pre style='white-space:pre-wrap;border-left:3px solid #8B2956;padding-left:12px'>{message}</pre>"
            f"</div>"
        )
        await self._send(
            settings.contact_to_email,
            f"[{settings.brand_name}] Contact — {name}",
            html,
        )

    async def send_owner_order_notification(self, order: dict) -> None:
        from .templates import owner_order_html

        html = owner_order_html(settings.brand_name, order)
        await self._send(
            settings.contact_to_email,
            f"[{settings.brand_name}] New order {order.get('id', '')[:8]}",
            html,
        )

    async def send_order_confirmation(self, order: dict) -> None:
        from .templates import customer_order_html

        html = customer_order_html(
            settings.brand_name,
            order,
            settings.contact_to_email,
        )
        await self._send(
            order["customer_email"],
            f"Order received — {settings.brand_name}",
            html,
        )

    async def send_email_verification(self, to_email: str, token: str) -> None:
        from .templates import email_verification_html

        verify_url = f"{settings.frontend_url}/verify-email?token={token}"
        html = email_verification_html(settings.brand_name, verify_url)
        await self._send(
            to_email,
            f"Verify your email — {settings.brand_name}",
            html,
        )

    async def send_password_reset(self, to_email: str, token: str) -> None:
        from .templates import password_reset_html

        reset_url = f"{settings.frontend_url}/reset-password?token={token}"
        html = password_reset_html(settings.brand_name, reset_url)
        await self._send(
            to_email,
            f"Reset your password — {settings.brand_name}",
            html,
        )

    async def send_order_status_update(self, order: dict) -> None:
        from .templates import order_status_update_html

        html = order_status_update_html(settings.brand_name, order, settings.frontend_url)
        status = order.get("status", "updated")
        subject_map = {
            "confirmed": f"Your order is confirmed — {settings.brand_name}",
            "packed": f"Your order is packed — {settings.brand_name}",
            "shipped": f"Your order has shipped — {settings.brand_name}",
            "out_for_delivery": f"Your order is out for delivery — {settings.brand_name}",
            "delivered": f"Your order has been delivered — {settings.brand_name}",
            "cancelled": f"Your order has been cancelled — {settings.brand_name}",
        }
        subject = subject_map.get(status, f"Order update — {settings.brand_name}")
        await self._send(order.get("customer_email", ""), subject, html)


email_service = EmailService()
