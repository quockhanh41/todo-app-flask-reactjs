from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from flaskr.models.notification_model import NotificationModel, NotificationType
from flaskr.models.task_model import TaskModel, TaskStatus


class NotificationRepository:
    @staticmethod
    def get_by_id_for_user(
        session: Session, user_id: int, notification_id: int
    ) -> Optional[NotificationModel]:
        return session.execute(
            select(NotificationModel).where(
                NotificationModel.id == notification_id,
                NotificationModel.user_id == user_id,
            )
        ).scalar_one_or_none()

    @staticmethod
    def get_by_task_and_type(
        session: Session,
        user_id: int,
        task_id: int,
        notification_type: NotificationType,
    ) -> Optional[NotificationModel]:
        return session.execute(
            select(NotificationModel).where(
                NotificationModel.user_id == user_id,
                NotificationModel.task_id == task_id,
                NotificationModel.type == notification_type,
            )
        ).scalar_one_or_none()

    @staticmethod
    def list_recent_by_user(session: Session, user_id: int, limit: int = 20) -> list[tuple]:
        return (
            session.query(
                NotificationModel.id,
                NotificationModel.task_id,
                TaskModel.title.label("task_title"),
                NotificationModel.type,
                NotificationModel.message,
                NotificationModel.is_read,
                NotificationModel.created_at,
            )
            .join(TaskModel, NotificationModel.task_id == TaskModel.id)
            .where(NotificationModel.user_id == user_id)
            .order_by(NotificationModel.created_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def count_unread_active(session: Session, user_id: int) -> int:
        return (
            session.query(func.count(NotificationModel.id))
            .join(TaskModel, NotificationModel.task_id == TaskModel.id)
            .where(
                NotificationModel.user_id == user_id,
                NotificationModel.is_read.is_(False),
                TaskModel.status != TaskStatus.COMPLETED,
            )
            .scalar()
            or 0
        )

    @staticmethod
    def mark_all_as_read(session: Session, user_id: int) -> None:
        session.query(NotificationModel).where(
            NotificationModel.user_id == user_id,
            NotificationModel.is_read.is_(False),
        ).update({"is_read": True}, synchronize_session=False)

    @staticmethod
    def add(session: Session, notification: NotificationModel) -> None:
        session.add(notification)
