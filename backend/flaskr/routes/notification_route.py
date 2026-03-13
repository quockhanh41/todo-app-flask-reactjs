from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint
from flask.views import MethodView

from flaskr.controllers.notification_controller import NotificationController
from flaskr.schemas.schema import NotificationListSchema

bp = Blueprint("notifications", __name__)


@bp.route("/notifications")
class Notifications(MethodView):
    @jwt_required()
    @bp.response(200, NotificationListSchema)
    def get(self):
        """Protected route (JWT Required)"""
        return NotificationController.get_feed()


@bp.route("/notifications/<notification_id>/read")
class NotificationRead(MethodView):
    @jwt_required()
    @bp.response(204)
    def patch(self, notification_id):
        """Protected route (JWT Required)"""
        return NotificationController.mark_read(notification_id)


@bp.route("/notifications/read-all")
class NotificationReadAll(MethodView):
    @jwt_required()
    @bp.response(204)
    def patch(self):
        """Protected route (JWT Required)"""
        return NotificationController.mark_all_read()
