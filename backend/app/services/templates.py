"""Responsive HTML email templates for Priya Sakshi.

Kept in a separate module so email_service.py stays small. All templates use
inline styles (email clients strip <style> tags) and match the brand palette.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List


def _shell(brand: str, content: str) -> str:
    return (
        f"<!DOCTYPE html><html><head><meta charset='utf-8'>"
        f"<meta name='viewport' content='width=device-width,initial-scale=1'>"
        f"</head><body style='margin:0;padding:0;background:#FAF7F2;font-family:Outfit,Arial,sans-serif;color:#2E2825'>"
        f"<table width='100%' cellpadding='0' cellspacing='0' style='background:#FAF7F2;padding:24px 12px'>"
        f"<tr><td align='center'>"
        f"<table width='560' cellpadding='0' cellspacing='0' style='max-width:560px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden'>"
        f"<tr><td style='background:#8B2956;padding:24px 32px;text-align:center'>"
        f"<span style='font-family:Cormorant Garamond,Georgia,serif;font-size:26px;color:#fff;font-weight:600;letter-spacing:0.5px'>{brand}</span>"
        f"</td></tr>"
        f"<tr><td style='padding:32px;line-height:1.6;font-size:15px'>{content}</td></tr>"
        f"<tr><td style='background:#F3EBDC;padding:20px 32px;text-align:center;font-size:12px;color:#2E2825'>"
        f"© {datetime.now(timezone.utc).year} {brand} · Kanchipuram, Tamil Nadu"
        f"</td></tr></table></td></tr></table></body></html>"
    )


def _items_table(items: List[dict]) -> str:
    rows = "".join(
        f"<tr>"
        f"<td style='padding:10px 0;border-bottom:1px solid #EFE6D6'>{it.get('name','')}</td>"
        f"<td style='padding:10px 0;border-bottom:1px solid #EFE6D6;text-align:center'>×{it.get('quantity',1)}</td>"
        f"<td style='padding:10px 0;border-bottom:1px solid #EFE6D6;text-align:right'>₹{it.get('price',0):,.0f}</td>"
        f"</tr>"
        for it in items
    )
    return (
        f"<table width='100%' cellpadding='0' cellspacing='0' style='font-size:14px'>"
        f"<tr style='color:#8B2956;font-weight:600'>"
        f"<td style='padding:8px 0;border-bottom:2px solid #EFE6D6'>Product</td>"
        f"<td style='padding:8px 0;border-bottom:2px solid #EFE6D6;text-align:center'>Qty</td>"
        f"<td style='padding:8px 0;border-bottom:2px solid #EFE6D6;text-align:right'>Price</td>"
        f"</tr>{rows}</table>"
    )


def _address_block(shipping: dict | None) -> str:
    if not shipping:
        return "<p><em>No shipping address provided.</em></p>"
    parts = [shipping.get("line1"), shipping.get("city"), shipping.get("state"), shipping.get("postal_code"), shipping.get("country")]
    lines = [p for p in parts if p]
    return "<br>".join(lines)


def owner_order_html(brand: str, order: dict) -> str:
    when = order.get("created_at", "")
    content = (
        f"<h2 style='color:#8B2956;margin-top:0'>New order received</h2>"
        f"<p><strong>Order ID:</strong> {order.get('id','')}</p>"
        f"<p><strong>Customer:</strong> {order.get('customer_name','')}</p>"
        f"<p><strong>Email:</strong> {order.get('customer_email','')}</p>"
        f"<p><strong>Phone:</strong> {order.get('phone') or '—'}</p>"
        f"<p><strong>Date &amp; Time:</strong> {when}</p>"
        f"<h3 style='color:#8B2956'>Shipping Address</h3>"
        f"<p>{_address_block(order.get('shipping'))}</p>"
        f"<h3 style='color:#8B2956'>Items</h3>"
        f"{_items_table(order.get('items', []))}"
        f"<p style='text-align:right;font-size:16px;margin-top:16px'>"
        f"<strong>Total: ₹{order.get('total',0):,.0f}</strong></p>"
    )
    return _shell(brand, content)


def customer_order_html(brand: str, order: dict, owner_email: str) -> str:
    when = order.get("created_at", "")
    content = (
        f"<h2 style='color:#8B2956;margin-top:0'>Thank you for your order!</h2>"
        f"<p>Hi {order.get('customer_name','there')},</p>"
        f"<p>We've received your order and our atelier is already preparing it with care. "
        f"Online payments will be available soon — we'll be in touch with next steps.</p>"
        f"<p><strong>Order ID:</strong> {order.get('id','')}</p>"
        f"<p><strong>Order Date:</strong> {when}</p>"
        f"<h3 style='color:#8B2956'>Your Items</h3>"
        f"{_items_table(order.get('items', []))}"
        f"<p style='text-align:right;font-size:16px;margin-top:16px'>"
        f"<strong>Total: ₹{order.get('total',0):,.0f}</strong></p>"
        f"<h3 style='color:#8B2956'>Shipping To</h3>"
        f"<p>{_address_block(order.get('shipping'))}</p>"
        f"<p style='background:#F3EBDC;padding:12px 16px;border-radius:12px'>"
        f"<strong>Order Status:</strong> Order Received</p>"
        f"<p style='margin-top:24px;font-size:13px;color:#2E2825'>"
        f"Need help? Reply to this email or write to {owner_email}.</p>"
    )
    return _shell(brand, content)


def email_verification_html(brand: str, verify_url: str) -> str:
    content = (
        f"<h2 style='color:#8B2956;margin-top:0'>Verify your email</h2>"
        f"<p>Welcome to {brand}. Please confirm your email address to activate your account.</p>"
        f"<p style='text-align:center;margin:24px 0'>"
        f"<a href='{verify_url}' style='background:#8B2956;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600'>Verify Email</a></p>"
        f"<p style='font-size:13px;color:#2E2825'>If the button doesn't work, copy this link: {verify_url}</p>"
    )
    return _shell(brand, content)


def password_reset_html(brand: str, reset_url: str) -> str:
    content = (
        f"<h2 style='color:#8B2956;margin-top:0'>Reset your password</h2>"
        f"<p>We received a request to reset your {brand} account password.</p>"
        f"<p style='text-align:center;margin:24px 0'>"
        f"<a href='{reset_url}' style='background:#8B2956;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600'>Reset Password</a></p>"
        f"<p style='font-size:13px;color:#2E2825'>If you didn't request this, you can safely ignore this email. Link: {reset_url}</p>"
    )
    return _shell(brand, content)


def order_status_update_html(brand: str, order: dict, frontend_url: str) -> str:
    status = order.get("status", "updated")
    status_labels = {
        "confirmed": "Confirmed",
        "processing": "Processing",
        "packed": "Packed",
        "shipped": "Shipped",
        "out_for_delivery": "Out for Delivery",
        "delivered": "Delivered",
        "cancelled": "Cancelled",
    }
    label = status_labels.get(status, status)

    tracking_block = ""
    if order.get("tracking_number"):
        courier = order.get("courier") or "our courier"
        tracking_block = (
            f"<p style='background:#F3EBDC;padding:14px 16px;border-radius:12px;margin:16px 0'>"
            f"<strong>Courier:</strong> {courier}<br>"
            f"<strong>Tracking Number:</strong> {order['tracking_number']}"
        )
        if order.get("estimated_delivery"):
            try:
                ed = order["estimated_delivery"][:10]
            except Exception:
                ed = order["estimated_delivery"]
            tracking_block += f"<br><strong>Estimated Delivery:</strong> {ed}"
        tracking_block += "</p>"

    timeline = order.get("timeline", [])
    timeline_html = ""
    if timeline:
        rows = "".join(
            f"<li style='margin-bottom:10px'><strong>{t.get('label', t.get('status', ''))}</strong>"
            f"<br><span style='font-size:13px;color:#2E2825'>{t.get('note', '')}</span>"
            f"<br><span style='font-size:11px;color:#2E2825'>{t.get('at', '')[:16]}</span></li>"
            for t in timeline[-6:]
        )
        timeline_html = (
            f"<h3 style='color:#8B2956;margin-top:24px'>Order Timeline</h3>"
            f"<ul style='padding-left:18px'>{rows}</ul>"
        )

    orders_link = f"{frontend_url}/account/orders"
    content = (
        f"<h2 style='color:#8B2956;margin-top:0'>Hi {order.get('customer_name','there')},</h2>"
        f"<p>Your order <strong>#{str(order.get('id',''))[:8]}</strong> has been updated to "
        f"<strong>{label}</strong>.</p>"
        f"{tracking_block}"
        f"{timeline_html}"
        f"<p style='margin-top:24px;font-size:13px;color:#2E2825'>"
        f"Track your order anytime: <a href='{orders_link}'>{orders_link}</a></p>"
    )
    return _shell(brand, content)
