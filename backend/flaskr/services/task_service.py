from typing import List

from sqlalchemy.exc import SQLAlchemyError

from flaskr.db import db
from flaskr.models.task_model import TaskModel
from flaskr.repositories.task_repository import TaskRepository


class TaskNotFound(Exception):
    pass


class ForbiddenTaskAccess(Exception):
    pass


class TaskService:
    @staticmethod
    def get_tasks_for_user(user_id: int) -> List[tuple]:
        session = db.session
        return TaskRepository.list_by_user(session, user_id)

    @staticmethod
    def create_task_for_user(user_id: int, data: dict) -> None:
        session = db.session

        try:
            create_data = {"user_id": user_id, **data}
            new_task = TaskModel(**create_data)

            TaskRepository.add(session, new_task)
            session.commit()
        except SQLAlchemyError:
            session.rollback()
            raise

    @staticmethod
    def update_task_for_user(user_id: int, task_id: int, data: dict) -> None:
        session = db.session

        try:
            task = TaskRepository.get_by_id(session, task_id)

            if task is None:
                raise TaskNotFound()

            if task.user_id != user_id:
                raise ForbiddenTaskAccess()

            task.title = data["title"]
            task.content = data["content"]
            task.status = data["status"]

            TaskRepository.add(session, task)
            session.commit()
        except (TaskNotFound, ForbiddenTaskAccess):
            raise
        except SQLAlchemyError:
            session.rollback()
            raise

    @staticmethod
    def delete_task_for_user(user_id: int, task_id: int) -> None:
        session = db.session

        try:
            task = TaskRepository.get_by_id(session, task_id)

            if task is None:
                raise TaskNotFound()

            if task.user_id != user_id:
                raise ForbiddenTaskAccess()

            TaskRepository.delete(session, task)
            session.commit()
        except (TaskNotFound, ForbiddenTaskAccess):
            raise
        except SQLAlchemyError:
            session.rollback()
            raise

