"""Add refresh sessions, admin audit log and payment idempotency.

Revision ID: 20260615_01
Revises: 20260612_02
Create Date: 2026-06-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260615_01"
down_revision = "20260612_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = inspect(op.get_bind())
    tables = set(inspector.get_table_names())

    if "refresh_sessions" not in tables:
        op.create_table(
            "refresh_sessions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("token_id", sa.String(64), nullable=False),
            sa.Column("family_id", sa.String(64), nullable=False),
            sa.Column("token_hash", sa.String(64), nullable=False),
            sa.Column("user_agent", sa.String(500), nullable=False, server_default=""),
            sa.Column("ip_address", sa.String(80), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("revoked_at", sa.DateTime(), nullable=True),
            sa.Column(
                "replaced_by_token_id",
                sa.String(64),
                nullable=False,
                server_default="",
            ),
            sa.UniqueConstraint("token_id"),
            sa.UniqueConstraint("token_hash"),
        )
        op.create_index(
            "ix_refresh_sessions_user_id",
            "refresh_sessions",
            ["user_id"],
        )
        op.create_index(
            "ix_refresh_sessions_family_id",
            "refresh_sessions",
            ["family_id"],
        )
        op.create_index(
            "ix_refresh_sessions_expires_at",
            "refresh_sessions",
            ["expires_at"],
        )

    if "admin_audit_logs" not in tables:
        op.create_table(
            "admin_audit_logs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "admin_user_id",
                sa.Integer(),
                sa.ForeignKey("users.id"),
                nullable=False,
            ),
            sa.Column("action", sa.String(100), nullable=False),
            sa.Column("entity_type", sa.String(80), nullable=False),
            sa.Column("entity_id", sa.String(100), nullable=False, server_default=""),
            sa.Column("ip_address", sa.String(80), nullable=False, server_default=""),
            sa.Column("user_agent", sa.String(500), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("metadata_json", sa.Text(), nullable=False, server_default="{}"),
        )
        op.create_index(
            "ix_admin_audit_logs_admin_user_id",
            "admin_audit_logs",
            ["admin_user_id"],
        )
        op.create_index(
            "ix_admin_audit_logs_action",
            "admin_audit_logs",
            ["action"],
        )

    payment_columns = {
        column["name"] for column in inspector.get_columns("payments")
    }
    if "idempotency_key" not in payment_columns:
        with op.batch_alter_table("payments") as batch:
            batch.add_column(
                sa.Column("idempotency_key", sa.String(100), nullable=True)
            )
            batch.create_unique_constraint(
                "uq_payments_idempotency_key",
                ["idempotency_key"],
            )


def downgrade() -> None:
    inspector = inspect(op.get_bind())
    tables = set(inspector.get_table_names())
    if "payments" in tables:
        payment_columns = {
            column["name"] for column in inspector.get_columns("payments")
        }
        if "idempotency_key" in payment_columns:
            with op.batch_alter_table("payments") as batch:
                batch.drop_column("idempotency_key")
    if "admin_audit_logs" in tables:
        op.drop_table("admin_audit_logs")
    if "refresh_sessions" in tables:
        op.drop_table("refresh_sessions")
