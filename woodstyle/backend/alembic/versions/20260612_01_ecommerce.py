"""Upgrade the legacy catalogue to the local e-commerce schema.

Revision ID: 20260612_01
Revises:
Create Date: 2026-06-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

from app.core.config import LEGACY_RUB_PER_USD
from app.core.database import Base
from app import models  # noqa: F401


revision = "20260612_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    if "orders" in tables:
        columns = {item["name"] for item in inspector.get_columns("orders")}
        if "customer_name" in columns and "user_id" not in columns:
            op.rename_table("orders", "legacy_inquiries")
            inspector = inspect(bind)
            tables = set(inspector.get_table_names())

    if "categories" in tables:
        columns = {item["name"] for item in inspector.get_columns("categories")}
        with op.batch_alter_table("categories") as batch:
            if "parent_id" not in columns:
                batch.add_column(sa.Column("parent_id", sa.Integer(), nullable=True))
            if "is_active" not in columns:
                batch.add_column(
                    sa.Column(
                        "is_active",
                        sa.Boolean(),
                        nullable=False,
                        server_default=sa.true(),
                    )
                )

    if "products" in tables:
        columns = {item["name"] for item in inspector.get_columns("products")}
        additions = {
            "slug": sa.Column("slug", sa.String(160), nullable=True),
            "sku": sa.Column("sku", sa.String(80), nullable=True),
            "price_usd_cents": sa.Column(
                "price_usd_cents",
                sa.Integer(),
                nullable=True,
            ),
            "stock": sa.Column(
                "stock",
                sa.Integer(),
                nullable=False,
                server_default="20",
            ),
            "is_active": sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            ),
            "created_at": sa.Column("created_at", sa.DateTime(), nullable=True),
            "updated_at": sa.Column("updated_at", sa.DateTime(), nullable=True),
        }
        with op.batch_alter_table("products") as batch:
            for name, column in additions.items():
                if name not in columns:
                    batch.add_column(column)
        rows = bind.execute(
            text("SELECT id, price, slug, sku, price_usd_cents FROM products")
        ).mappings()
        for row in rows:
            bind.execute(
                text(
                    "UPDATE products SET slug=:slug, sku=:sku, "
                    "price_usd_cents=:price, "
                    "created_at=COALESCE(created_at, CURRENT_TIMESTAMP), "
                    "updated_at=COALESCE(updated_at, CURRENT_TIMESTAMP) "
                    "WHERE id=:id"
                ),
                {
                    "id": row["id"],
                    "slug": row["slug"] or f"product-{row['id']}",
                    "sku": row["sku"] or f"WS-{row['id']:04d}",
                    "price": row["price_usd_cents"]
                    or round(row["price"] / LEGACY_RUB_PER_USD * 100),
                },
            )

    if "contact_messages" in tables:
        columns = {
            item["name"]
            for item in inspector.get_columns("contact_messages")
        }
        if "is_processed" not in columns:
            with op.batch_alter_table("contact_messages") as batch:
                batch.add_column(
                    sa.Column(
                        "is_processed",
                        sa.Boolean(),
                        nullable=False,
                        server_default=sa.false(),
                    )
                )

    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    # User data is intentionally preserved on downgrade.
    pass
