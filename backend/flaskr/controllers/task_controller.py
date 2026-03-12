from flask_jwt_extended import get_jwt_identity
from flask_smorest import abort

from flaskr.services.task_service import (
    ForbiddenTaskAccess,
    TaskNotFound,
    TaskService,
)


class TaskController:
    @staticmethod
    def get_all_on_user():
        user_id = get_jwt_identity()
        try:
            return TaskService.get_tasks_for_user(int(user_id))
        except Exception:
            abort(500, message="Internal server error while fetching tasks on user")

    @staticmethod
    def create(data):
        user_id = get_jwt_identity()
        try:
            TaskService.create_task_for_user(int(user_id), data)
        except Exception:
            abort(500, message="Internal server error while creating task")

    @staticmethod
    def update(data, task_id):
        user_id = get_jwt_identity()
        try:
            TaskService.update_task_for_user(int(user_id), int(task_id), data)
        except TaskNotFound:
            abort(404, message="Task not found")
        except ForbiddenTaskAccess:
            abort(403, message="Forbidden")
        except Exception:
            abort(500, message="Internal server error while updating task")

    @staticmethod
    def delete(task_id):
        user_id = get_jwt_identity()
        try:
            TaskService.delete_task_for_user(int(user_id), int(task_id))
        except TaskNotFound:
            abort(404, message="Task not found")
        except ForbiddenTaskAccess:
            abort(403, message="Forbidden")
        except Exception:
            abort(500, message="Internal server error while deleting task")
