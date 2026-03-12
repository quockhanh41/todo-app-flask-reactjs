from flask_jwt_extended import get_jwt_identity
from flask_smorest import abort

from flaskr.services.user_service import (
    UserConflict,
    UserNotFound,
    UserService,
)


class UserController:
    @staticmethod
    def get_all():
        try:
            return UserService.list_users()
        except Exception:
            abort(500, message="Internal server error while fetching users")

    @staticmethod
    def get_by_id(user_id):
        try:
            return UserService.get_user_by_id(int(user_id))
        except UserNotFound:
            abort(404, message="User not found")
        except Exception:
            abort(500, message="Internal server error while fetching user")

    @staticmethod
    def create(data):
        try:
            UserService.create_user(data)
        except UserConflict as conflict:
            if conflict.field == "username":
                abort(409, message="Username already registered")
            if conflict.field == "email":
                abort(409, message="Email already registered")
            abort(409, message="User already registered")
        except Exception:
            abort(500, message="Internal server error while creating user")

    @staticmethod
    def delete():
        try:
            user_id = get_jwt_identity()
            UserService.delete_current_user(int(user_id))
        except UserNotFound:
            abort(404, message="User not found")
        except Exception:
            abort(500, message="Internal server error while deleting user")
