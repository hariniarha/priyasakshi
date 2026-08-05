"""Admin routes — all scoped to the admin role via get_admin_user.

These endpoints live under /api/admin/* and cover dashboard metrics,
order management, customer aggregation, and contact-message moderation.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..dependencies import get_admin_user
from ..models.admin import AdminOrderUpdate
from ..services.admin_service import admin_service
from ..services.email_service import email_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def dashboard(admin=Depends(get_admin_user)):
    return {"ok": True, "data": await admin_service.dashboard()}


@router.get("/orders")
async def list_orders(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None, alias="status"),
    payment_status: str | None = Query(default=None, alias="payment_status"),
    admin=Depends(get_admin_user),
):
    orders = await admin_service.list_orders(
        search=search, status=status, payment_status=payment_status
    )
    return {"ok": True, "orders": orders}


@router.get("/orders/{order_id}")
async def get_order(order_id: str, admin=Depends(get_admin_user)):
    order = await admin_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True, "order": order}


@router.patch("/orders/{order_id}")
async def update_order(order_id: str, payload: AdminOrderUpdate, admin=Depends(get_admin_user)):
    order = await admin_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    updated = await admin_service.update_order(order_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found")

    # Send a customer notification email when the status changes to one of
    # the milestone statuses. Tracking details are included when available.
    if payload.status:
        await email_service.send_order_status_update(updated)

    return {"ok": True, "order": updated}


@router.get("/customers")
async def list_customers(admin=Depends(get_admin_user)):
    return {"ok": True, "customers": await admin_service.list_customers()}


@router.get("/messages")
async def list_messages(
    search: str | None = Query(default=None),
    admin=Depends(get_admin_user),
):
    return {"ok": True, "messages": await admin_service.list_messages(search=search)}


@router.patch("/messages/{message_id}/read")
async def mark_message_read(message_id: str, admin=Depends(get_admin_user)):
    msg = await admin_service.mark_message_read(message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"ok": True, "message": msg}


@router.delete("/messages/{message_id}")
async def delete_message(message_id: str, admin=Depends(get_admin_user)):
    ok = await admin_service.delete_message(message_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"ok": True, "message": "Message deleted"}
