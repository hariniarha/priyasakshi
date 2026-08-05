"""Admin request/response schemas."""
from typing import List, Optional

from pydantic import BaseModel, Field


class AdminOrderUpdate(BaseModel):
    status: Optional[str] = Field(
        None,
        description="New order status: confirmed, processing, packed, shipped, "
        "out_for_delivery, delivered, cancelled",
    )
    courier: Optional[str] = Field(None, max_length=120)
    tracking_number: Optional[str] = Field(None, max_length=120)
    estimated_delivery: Optional[str] = Field(
        None, description="ISO date string for estimated delivery"
    )
    internal_notes: Optional[str] = Field(None, max_length=4000)


class AdminMessageUpdate(BaseModel):
    read: Optional[bool] = None


class AdminDashboard(BaseModel):
    total_orders: int
    pending_orders: int
    processing_orders: int
    shipped_orders: int
    delivered_orders: int
    revenue: float
    total_customers: int
    recent_orders: List[dict]


class AdminCustomer(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    total_orders: int
    lifetime_spend: float


class AdminCustomerList(BaseModel):
    customers: List[AdminCustomer]
    total: int


class AdminMessageOut(BaseModel):
    id: str
    name: str
    email: str
    message: str
    created_at: str
    read: bool = False


class AdminMessageList(BaseModel):
    messages: List[AdminMessageOut]
    total: int
