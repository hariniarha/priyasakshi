"""Admin service — dashboard metrics, order management, customer aggregation.

All reads/writes go through MongoDB collections that already exist
(`orders`, `users`, `contact_messages`). Nothing here mutates customer
auth or payment records; it only updates order status/tracking fields.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from pymongo import ReturnDocument

from ..db import get_db, serialize_doc, serialize_docs
from ..models.admin import AdminOrderUpdate

logger = logging.getLogger("priya_sakshi.admin")

# Statuses that count as "delivered" for revenue.
PAID_STATUSES = {"paid", "delivered"}

# Statuses the dashboard groups into "pending" / "processing" / "shipped".
PENDING_STATUSES = {"received", "pending", "pending_payment"}
PROCESSING_STATUSES = {"confirmed", "processing", "packed"}
SHIPPED_STATUSES = {"shipped", "out_for_delivery"}


class AdminService:
    async def dashboard(self) -> dict:
        db = get_db()
        orders_cursor = db.orders.find({})
        orders = await orders_cursor.to_list(length=None)

        total_orders = len(orders)
        pending = sum(1 for o in orders if o.get("status") in PENDING_STATUSES)
        processing = sum(1 for o in orders if o.get("status") in PROCESSING_STATUSES)
        shipped = sum(1 for o in orders if o.get("status") in SHIPPED_STATUSES)
        delivered = sum(1 for o in orders if o.get("status") == "delivered")

        # Revenue = sum of totals for orders that are paid or delivered.
        revenue = 0.0
        for o in orders:
            if o.get("payment_status") == "paid" or o.get("status") == "delivered":
                try:
                    revenue += float(o.get("total") or 0)
                except (TypeError, ValueError):
                    pass

        total_customers = await db.users.count_documents({"role": "customer"})

        recent = sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:8]
        return {
            "total_orders": total_orders,
            "pending_orders": pending,
            "processing_orders": processing,
            "shipped_orders": shipped,
            "delivered_orders": delivered,
            "revenue": round(revenue, 2),
            "total_customers": total_customers,
            "recent_orders": serialize_docs(recent),
        }

    async def list_orders(
        self,
        *,
        search: Optional[str] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        limit: int = 100,
    ) -> list[dict]:
        query: dict = {}
        if status:
            query["status"] = status
        if payment_status:
            query["payment_status"] = payment_status
        if search:
            # Case-insensitive substring search across customer + order id fields.
            import re

            rx = re.compile(re.escape(search), re.IGNORECASE)
            query["$or"] = [
                {"customer_name": rx},
                {"customer_email": rx},
                {"phone": rx},
                {"id": rx},
            ]

        cursor = get_db().orders.find(query).sort("created_at", -1).limit(limit)
        return serialize_docs(await cursor.to_list(length=None))

    async def get_order(self, order_id: str) -> dict | None:
        return serialize_doc(await get_db().orders.find_one({"id": order_id}))

    async def update_order(self, order_id: str, payload: AdminOrderUpdate) -> dict | None:
        update_fields: dict = {}
        if payload.status is not None:
            update_fields["status"] = payload.status
        if payload.courier is not None:
            update_fields["courier"] = payload.courier
        if payload.tracking_number is not None:
            update_fields["tracking_number"] = payload.tracking_number
        if payload.estimated_delivery is not None:
            update_fields["estimated_delivery"] = payload.estimated_delivery
        if payload.internal_notes is not None:
            update_fields["internal_notes"] = payload.internal_notes

        if not update_fields:
            return await self.get_order(order_id)

        now = datetime.now(timezone.utc).isoformat()

        # Build a timeline entry describing this change.
        label_map = {
            "received": "Order Received",
            "pending": "Order Pending",
            "pending_payment": "Payment Pending",
            "confirmed": "Order Confirmed",
            "processing": "Processing",
            "packed": "Packed",
            "shipped": "Shipped",
            "out_for_delivery": "Out for Delivery",
            "delivered": "Delivered",
            "cancelled": "Cancelled",
        }
        timeline_entry = {
            "status": payload.status or "updated",
            "label": label_map.get(payload.status, "Updated"),
            "at": now,
            "note": "Status updated by admin",
        }

        update_doc = {"$set": update_fields, "$push": {"timeline": timeline_entry}}

        updated = await get_db().orders.find_one_and_update(
            {"id": order_id},
            update_doc,
            return_document=ReturnDocument.AFTER,
        )
        return serialize_doc(updated)

    async def list_customers(self) -> list[dict]:
        db = get_db()
        users = await db.users.find({"role": "customer"}).to_list(length=None)
        orders = await db.orders.find({}).to_list(length=None)

        # Aggregate orders per user id and per email.
        by_user_id: dict[str, dict] = {}
        by_email: dict[str, dict] = {}
        for o in orders:
            total = 0.0
            try:
                total = float(o.get("total") or 0)
            except (TypeError, ValueError):
                pass
            uid = o.get("user_id")
            email = (o.get("customer_email") or "").lower()
            if uid:
                bucket = by_user_id.setdefault(uid, {"count": 0, "spend": 0.0})
                bucket["count"] += 1
                bucket["spend"] += total
            if email:
                bucket = by_email.setdefault(email, {"count": 0, "spend": 0.0})
                bucket["count"] += 1
                bucket["spend"] += total

        customers = []
        for u in users:
            email = (u.get("email") or "").lower()
            uid = u.get("id")
            agg = by_user_id.get(uid) or by_email.get(email) or {"count": 0, "spend": 0.0}
            customers.append(
                {
                    "id": uid,
                    "name": u.get("name", ""),
                    "email": email,
                    "phone": u.get("phone"),
                    "total_orders": agg["count"],
                    "lifetime_spend": round(agg["spend"], 2),
                    "created_at": u.get("created_at"),
                }
            )
        customers.sort(key=lambda c: c["lifetime_spend"], reverse=True)
        return customers

    async def list_messages(self, *, search: Optional[str] = None) -> list[dict]:
        query: dict = {}
        if search:
            import re

            rx = re.compile(re.escape(search), re.IGNORECASE)
            query["$or"] = [{"name": rx}, {"email": rx}, {"message": rx}]
        cursor = get_db().contact_messages.find(query).sort("created_at", -1)
        return serialize_docs(await cursor.to_list(length=None))

    async def mark_message_read(self, message_id: str) -> dict | None:
        return serialize_doc(
            await get_db().contact_messages.find_one_and_update(
                {"id": message_id},
                {"$set": {"read": True}},
                return_document=ReturnDocument.AFTER,
            )
        )

    async def delete_message(self, message_id: str) -> bool:
        res = await get_db().contact_messages.delete_one({"id": message_id})
        return res.deleted_count > 0


admin_service = AdminService()
