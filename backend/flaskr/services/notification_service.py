from datetime import datetime, timezone

from sqlalchemy.exc import SQLAlchemyError

from flaskr.db import db
from flaskr.models.notification_model import NotificationModel, NotificationType
from flaskr.repositories.notification_repository import NotificationRepository
from flaskr.repositories.task_repository import TaskRepository


class NotificationNotFound(Exception):
    pass


class NotificationService:
    DUE_SOON_WINDOW_MINUTES = 30

    @staticmethod
    def get_notification_feed(user_id: int) -> dict:
        NotificationService._sync_notifications_for_user(user_id)

        session = db.session
        return {
            "items": NotificationRepository.list_recent_by_user(session, user_id),
            "unread_count": NotificationRepository.count_unread_active(session, user_id),
        }

    @staticmethod
    def mark_as_read(user_id: int, notification_id: int) -> None:
        session = db.session

        try:
            notification = NotificationRepository.get_by_id_for_user(
                session, user_id, notification_id
            )
            if notification is None:
                raise NotificationNotFound()

            notification.is_read = True
            NotificationRepository.add(session, notification)
            session.commit()
        except NotificationNotFound:
            raise
        except SQLAlchemyError:
            session.rollback()
            raise

    @staticmethod
    def mark_all_as_read(user_id: int) -> None:
        session = db.session

        try:
            NotificationRepository.mark_all_as_read(session, user_id)
            session.commit()
        except SQLAlchemyError:
            session.rollback()
            raise

    @staticmethod
    def _sync_notifications_for_user(user_id: int) -> None:
        session = db.session

        try:
            tasks = TaskRepository.list_open_with_deadline_by_user(session, user_id)
            now = datetime.now(timezone.utc)

            for task in tasks:
                if task.deadline is None:
                    continue

                deadline = task.deadline
                if deadline.tzinfo is None:
                    deadline = deadline.replace(tzinfo=timezone.utc)

                minutes_until_deadline = (deadline - now).total_seconds() / 60

                if 0 <= minutes_until_deadline <= NotificationService.DUE_SOON_WINDOW_MINUTES:
                    NotificationService._create_if_missing(
                        session=session,
                        user_id=user_id,
                        task_id=task.id,
                        notification_type=NotificationType.TASK_DUE_SOON,
                        message=(
                            f'Task "{task.title}" is due soon at '
                            f'{deadline.strftime("%Y-%m-%d %H:%M UTC")}. '
                        ),
                    )

                if now > deadline:
                    overdue_minutes = int((now - deadline).total_seconds() // 60)
                    NotificationService._create_if_missing(
                        session=session,
                        user_id=user_id,
                        task_id=task.id,
                        notification_type=NotificationType.TASK_OVERDUE,
                        message=(
                            f'Task "{task.title}" is overdue by '
                            f"{max(overdue_minutes, 1)} minute(s)."
                        ),
                    )

            session.commit()
        except SQLAlchemyError:
            session.rollback()
            raise

    @staticmethod
    def _create_if_missing(
        session,
        user_id: int,
        task_id: int,
        notification_type: NotificationType,
        message: str,
    ) -> None:
        existing = NotificationRepository.get_by_task_and_type(
            session,
            user_id,
            task_id,
            notification_type,
        )
        if existing is not None:
            return

        NotificationRepository.add(
            session,
            NotificationModel(
                user_id=user_id,
                task_id=task_id,
                type=notification_type,
                message=message,
            ),
        )
