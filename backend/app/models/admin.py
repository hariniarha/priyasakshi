"""Admin request/response schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class AdminOrderUpdate(BaseModel):
    status: Optional[str] = Field(
        None,
        description="One of: pending, confirmed, processing, packed, shipped, out_for_delivery, delivered, cancelled",
    )
    courier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[str] = None
    internal_notes: Optional[str] = None


class AdminDashboardResponse(BaseModel):
    total_orders: int
    pending_orders: int
    processing_orders: int
    shipped_orders: int
    delivered_orders: int
    revenue: float
    total_customers: int
    recent_orders: List[dict]


class AdminCustomerOut(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    total_orders: int = 0
    lifetime_spend: float = 0.0
    created_at: Optional[str] = None


class AdminMessageOut(BaseModel):
    id: str
    name: str
    email: str
    message: str
    read: bool = False
    created_at: Optional[str] = None
