from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from flaskr.models.tag_model import TagModel
from flaskr.models.task_model import TaskModel


class TaskRepository:
    @staticmethod
    def list_by_user(session: Session, user_id: int) -> List[tuple]:
        return (
            session.query(
                TaskModel.id,
                TaskModel.title,
                TaskModel.content,
                TaskModel.status,
                TaskModel.created_at,
                TagModel.name.label("tag_name"),
            )
            .where(TaskModel.user_id == user_id)
            .join(TagModel, TaskModel.tag_id == TagModel.id)
            .all()
        )

    @staticmethod
    def get_by_id(session: Session, task_id: int) -> Optional[TaskModel]:
        return session.execute(
            select(TaskModel).where(TaskModel.id == task_id)
        ).scalar_one_or_none()

    @staticmethod
    def add(session: Session, task: TaskModel) -> None:
        session.add(task)

    @staticmethod
    def delete(session: Session, task: TaskModel) -> None:
        session.delete(task)

