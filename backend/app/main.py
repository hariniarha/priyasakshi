"""FastAPI application factory + entrypoint.

Keep this file small: register middleware, mount routers, wire startup /
shutdown hooks. Business logic belongs in ``services``, request/response
shapes in ``models``, HTTP handlers in ``routes``.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import close_db, get_db
from .routes import addresses, auth, contact, health, newsletter, orders, payments, profile

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("priya_sakshi")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup: touch the DB so misconfiguration surfaces immediately.
    try:
        await get_db().command("ping")
        logger.info("Connected to MongoDB (db=%s)", settings.db_name)
    except Exception as exc:  # pragma: no cover - infra failure path
        logger.warning("MongoDB ping failed at startup: %s", exc)
    yield
    # Shutdown
    await close_db()
    logger.info("MongoDB connection closed")


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.brand_name} API",
        version="1.0.0",
        lifespan=lifespan,
    )

    # ---- CORS ----
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://www.priyasakshi.com",
            "https://priyasakshi.com",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- Routers (all prefixed with /api via ingress rules) ----
    app.include_router(health.router, prefix="/api")
    app.include_router(auth.router, prefix="/api")
    app.include_router(newsletter.router, prefix="/api")
    app.include_router(contact.router, prefix="/api")
    app.include_router(orders.router, prefix="/api")
    app.include_router(payments.router, prefix="/api")
    app.include_router(profile.router, prefix="/api")
    app.include_router(addresses.router, prefix="/api")

    return app


app = create_app()
