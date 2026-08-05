"""Admin routes — all scoped to admin users via the `get_admin_user` dependency.

Endpoints:
  GET    /api/admin/dashboard
  GET    /api/admin/orders
  GET    /api/admin/orders/{order_id}
  PATCH  /api/admin/orders/{order_id}
  GET    /api/admin/customers
  GET    /api/admin/messages
  PATCH  /api/admin/messages/{message_id}
  DELETE /api/admin/messages/{message_id}
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..dependencies import get_admin_user
from ..models.admin import (
    AdminDashboard,
    AdminCustomerList,
    AdminMessageList,
    AdminMessageUpdate,
    AdminOrderUpdate,
)
from ..services.admin_service import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=AdminDashboard)
async def dashboard(admin=Depends(get_admin_user)):
    return await admin_service.dashboard()


@router.get("/orders")
async def list_orders(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    payment_status: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    skip: int = Query(default=0, ge=0),
    admin=Depends(get_admin_user),
):
    orders = await admin_service.list_orders(
        search=search, status=status, payment_status=payment_status, limit=limit, skip=skip
    )
    return {"ok": True, "orders": orders, "total": len(orders)}


@router.get("/orders/{order_id}")
async def get_order(order_id: str, admin=Depends(get_admin_user)):
    order = await admin_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True, "order": order}


@router.patch("/orders/{order_id}")
async def update_order(
    order_id: str, payload: AdminOrderUpdate, admin=Depends(get_admin_user)
):
    updated = await admin_service.update_order(order_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True, "order": updated}


@router.get("/customers", response_model=AdminCustomerList)
async def list_customers(
    search: str | None = Query(default=None), admin=Depends(get_admin_user)
):
    return await admin_service.list_customers(search=search)


@router.get("/messages", response_model=AdminMessageList)
async def list_messages(
    search: str | None = Query(default=None), admin=Depends(get_admin_user)
):
    return await admin_service.list_messages(search=search)


@router.patch("/messages/{message_id}")
async def update_message(
    message_id: str,
    payload: AdminMessageUpdate,
    admin=Depends(get_admin_user),
):
    updated = await admin_service.mark_message_read(message_id, payload.read if payload.read is not None else True)
    if not updated:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"ok": True, "message": updated}


@router.delete("/messages/{message_id}")
async def delete_message(message_id: str, admin=Depends(get_admin_user)):
    ok = await admin_service.delete_message(message_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"ok": True, "message": "Message deleted"}
