"""Order persistence service.

Separated from the route so that payment providers, inventory checks, and
coupon logic can be layered on later without touching the HTTP layer.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from pymongo import ReturnDocument

from ..db import get_db, serialize_doc, serialize_docs
from ..models.order import OrderCreate

logger = logging.getLogger("priya_sakshi.orders")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class OrderService:
    async def record_order(self, payload: OrderCreate, user_id: Optional[str] = None) -> dict:
        now = _now()
        order = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "created_at": now,
            "status": "received",
            "payment_status": "unpaid",
            "tracking_number": None,
            "courier": None,
            "estimated_delivery": None,
            "timeline": [
                {
                    "status": "received",
                    "label": "Order Received",
                    "at": now,
                    "note": "Your order has been placed.",
                }
            ],
            "customer_name": payload.customer_name,
            "customer_email": str(payload.customer_email),
            "phone": payload.phone,
            "items": [i.model_dump() for i in payload.items],
            "shipping": payload.shipping.model_dump() if payload.shipping else None,
            "currency": payload.currency,
            "subtotal": payload.subtotal,
            "shipping_fee": payload.shipping_fee,
            "total": payload.total,
            "notes": payload.notes,
            "payment": None,  # populated by payment provider integration
        }

        await get_db().orders.insert_one(order)

        logger.info(
            "Order recorded id=%s user=%s email=%s items=%d total=%s",
            order["id"],
            user_id,
            order["customer_email"],
            len(order["items"]),
            order["total"],
        )

        return serialize_doc(order)

    async def get_order(self, order_id: str) -> dict | None:
        return serialize_doc(await get_db().orders.find_one({"id": order_id}))

    async def list_orders_for_user(self, user_id: str, email: str | None = None) -> list[dict]:
        query: dict = {"user_id": user_id}
        if email:
            query = {"$or": [{"user_id": user_id}, {"customer_email": email.lower()}]}
        cursor = get_db().orders.find(query).sort("created_at", -1)
        return serialize_docs(await cursor.to_list(length=None))

    async def mark_payment_initiated(
        self,
        order_id: str,
        razorpay_order_id: str,
    ) -> None:
        """Called right after a Razorpay order is created for this order."""
        now = _now()
        await get_db().orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "status": "pending_payment",
                    "payment_status": "pending",
                    "payment": {
                        "provider": "razorpay",
                        "razorpay_order_id": razorpay_order_id,
                        "status": "created",
                    },
                },
                "$push": {
                    "timeline": {
                        "status": "pending_payment",
                        "label": "Payment Pending",
                        "at": now,
                        "note": "Awaiting payment confirmation.",
                    }
                },
            },
        )

    async def mark_payment_verified(
        self,
        *,
        order_id: str,
        razorpay_order_id: str,
        razorpay_payment_id: str,
    ) -> dict | None:
        """Called once the Razorpay signature has been verified."""
        now = _now()
        updated = await get_db().orders.find_one_and_update(
            {"id": order_id},
            {
                "$set": {
                    "status": "paid",
                    "payment_status": "paid",
                    "payment": {
                        "provider": "razorpay",
                        "razorpay_order_id": razorpay_order_id,
                        "razorpay_payment_id": razorpay_payment_id,
                        "status": "verified",
                        "verified_at": now,
                    },
                },
                "$push": {
                    "timeline": {
                        "status": "paid",
                        "label": "Payment Confirmed",
                        "at": now,
                        "note": "Payment verified successfully.",
                    }
                },
            },
            return_document=ReturnDocument.AFTER,
        )
        return serialize_doc(updated)


order_service = OrderService()
