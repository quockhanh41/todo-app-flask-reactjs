from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, Enum as SaEnum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from flaskr.db import db


class NotificationType(Enum):
    TASK_DUE_SOON = "TASK_DUE_SOON"
    TASK_OVERDUE = "TASK_OVERDUE"


class NotificationModel(db.Model):
    __tablename__ = "notifications"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "task_id",
            "type",
            name="uq_notifications_user_task_type",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[NotificationType] = mapped_column(SaEnum(NotificationType), nullable=False)
    message: Mapped[str] = mapped_column(String(300), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), index=True
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), nullable=False, index=True)

    user = relationship("UserModel", back_populates="notifications")
    task = relationship("TaskModel", back_populates="notifications")
