"""add deadline and priority to tasks

Revision ID: a1b2c3d4e5f6
Revises: 942896c5c2e6
Create Date: 2026-03-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "942896c5c2e6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "postgresql":
        priority_enum = postgresql.ENUM(
            "LOW", "MEDIUM", "HIGH", name="taskpriority", create_type=True
        )
        priority_enum.create(bind, checkfirst=True)
        priority_type = priority_enum
    else:
        priority_type = sa.Enum("LOW", "MEDIUM", "HIGH", name="taskpriority")

    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "deadline",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "priority",
                priority_type,
                nullable=False,
                server_default="MEDIUM",
            )
        )
        batch_op.create_index(
            batch_op.f("ix_tasks_deadline"),
            ["deadline"],
            unique=False,
        )


def downgrade():
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_tasks_deadline"))
        batch_op.drop_column("priority")
        batch_op.drop_column("deadline")

    if dialect_name == "postgresql":
        priority_enum = postgresql.ENUM(
            "LOW", "MEDIUM", "HIGH", name="taskpriority", create_type=True
        )
        priority_enum.drop(bind, checkfirst=True)

