from flask_jwt_extended import get_jwt_identity
from flask_smorest import abort

from flaskr.services.notification_service import (
    NotificationNotFound,
    NotificationService,
)


class NotificationController:
    @staticmethod
    def get_feed():
        user_id = get_jwt_identity()
        try:
            return NotificationService.get_notification_feed(int(user_id))
        except Exception:
            abort(500, message="Internal server error while fetching notifications")

    @staticmethod
    def mark_read(notification_id: int):
        user_id = get_jwt_identity()
        try:
            NotificationService.mark_as_read(int(user_id), int(notification_id))
        except NotificationNotFound:
            abort(404, message="Notification not found")
        except Exception:
            abort(500, message="Internal server error while updating notification")

    @staticmethod
    def mark_all_read():
        user_id = get_jwt_identity()
        try:
            NotificationService.mark_all_as_read(int(user_id))
        except Exception:
            abort(500, message="Internal server error while updating notifications")
