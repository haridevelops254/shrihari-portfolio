"""initial schema: admin_users, resumes, audit_events

Revision ID: 0001
Revises:
"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "admin_users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_admin_users_email", "admin_users", ["email"], unique=True)
    op.create_table(
        "resumes",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("series_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("custom_category", sa.String(80)),
        sa.Column("category_key", sa.String(100), nullable=False),
        sa.Column("version", sa.String(40), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("original_filename", sa.String(200), nullable=False),
        sa.Column("storage_key", sa.String(200), nullable=False, unique=True),
        sa.Column("mime_type", sa.String(120), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column("visibility", sa.String(16), nullable=False),
        sa.Column("is_default_for_category", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_by", sa.Uuid()),
        sa.CheckConstraint("visibility in ('draft','published','archived')", name="ck_resume_visibility"),
        sa.UniqueConstraint("category_key", "title", "version", name="uq_resume_cat_title_version"),
    )
    op.create_index("ix_resumes_series_id", "resumes", ["series_id"])
    op.create_index("ix_resume_visibility_category", "resumes", ["visibility", "category_key"])
    op.create_index("uq_resume_one_default_per_category", "resumes", ["category_key"], unique=True,
                    postgresql_where=sa.text("is_default_for_category"), sqlite_where=sa.text("is_default_for_category"))
    op.create_table(
        "audit_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("actor_id", sa.Uuid()),
        sa.Column("action", sa.String(60), nullable=False),
        sa.Column("resume_id", sa.Uuid()),
        sa.Column("outcome", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_audit_events_action", "audit_events", ["action"])
    op.create_index("ix_audit_events_resume_id", "audit_events", ["resume_id"])
    op.create_index("ix_audit_events_created_at", "audit_events", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_events")
    op.drop_table("resumes")
    op.drop_table("admin_users")
