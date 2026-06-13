"""Add German, Japanese and French localized fields.

Revision ID: 20260612_02
Revises: 20260612_01
Create Date: 2026-06-12
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260612_02"
down_revision = "20260612_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = inspect(op.get_bind())
    image_columns = {
        column["name"] for column in inspector.get_columns("product_images")
    }
    image_additions = {
        "alt_de": sa.Column(
            "alt_de", sa.String(200), nullable=False, server_default=""
        ),
        "alt_ja": sa.Column(
            "alt_ja", sa.String(200), nullable=False, server_default=""
        ),
        "alt_fr": sa.Column(
            "alt_fr", sa.String(200), nullable=False, server_default=""
        ),
    }
    with op.batch_alter_table("product_images") as batch:
        for name, column in image_additions.items():
            if name not in image_columns:
                batch.add_column(column)

    shipping_columns = {
        column["name"] for column in inspector.get_columns("shipping_zones")
    }
    shipping_additions = {
        "name_de": sa.Column(
            "name_de", sa.String(120), nullable=False, server_default=""
        ),
        "name_ja": sa.Column(
            "name_ja", sa.String(120), nullable=False, server_default=""
        ),
        "name_fr": sa.Column(
            "name_fr", sa.String(120), nullable=False, server_default=""
        ),
    }
    with op.batch_alter_table("shipping_zones") as batch:
        for name, column in shipping_additions.items():
            if name not in shipping_columns:
                batch.add_column(column)


def downgrade() -> None:
    inspector = inspect(op.get_bind())
    shipping_columns = {
        column["name"] for column in inspector.get_columns("shipping_zones")
    }
    with op.batch_alter_table("shipping_zones") as batch:
        for name in ("name_fr", "name_ja", "name_de"):
            if name in shipping_columns:
                batch.drop_column(name)

    image_columns = {
        column["name"] for column in inspector.get_columns("product_images")
    }
    with op.batch_alter_table("product_images") as batch:
        for name in ("alt_fr", "alt_ja", "alt_de"):
            if name in image_columns:
                batch.drop_column(name)
