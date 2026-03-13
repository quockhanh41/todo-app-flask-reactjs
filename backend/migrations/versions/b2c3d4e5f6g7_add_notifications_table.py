"""add notifications table

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-13 00:00:01.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6g7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "postgresql":
        notification_enum = postgresql.ENUM(
            "TASK_DUE_SOON",
            "TASK_OVERDUE",
            name="notificationtype",
            create_type=True,
        )
        notification_enum.create(bind, checkfirst=True)
        notification_type = postgresql.ENUM(
            "TASK_DUE_SOON",
            "TASK_OVERDUE",
            name="notificationtype",
            create_type=False,
        )
    else:
        notification_type = sa.Enum(
            "TASK_DUE_SOON",
            "TASK_OVERDUE",
            name="notificationtype",
        )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("type", notification_type, nullable=False),
        sa.Column("message", sa.String(length=300), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "task_id",
            "type",
            name="uq_notifications_user_task_type",
        ),
    )
    op.create_index(op.f("ix_notifications_created_at"), "notifications", ["created_at"], unique=False)
    op.create_index(op.f("ix_notifications_task_id"), "notifications", ["task_id"], unique=False)
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)


def downgrade():
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_task_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_created_at"), table_name="notifications")
    op.drop_table("notifications")

    if dialect_name == "postgresql":
        notification_enum = postgresql.ENUM(
            "TASK_DUE_SOON",
            "TASK_OVERDUE",
            name="notificationtype",
            create_type=True,
        )
        notification_enum.drop(bind, checkfirst=True)
