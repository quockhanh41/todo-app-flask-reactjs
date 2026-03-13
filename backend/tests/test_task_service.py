from flaskr.db import db
from flaskr.models.task_model import TaskModel, TaskStatus, TaskPriority
from flaskr.models.tag_model import TagModel
from flaskr.models.user_model import UserModel
from flaskr.services.task_service import (
    ForbiddenTaskAccess,
    TaskNotFound,
    TaskService,
)


def _create_user(username: str, email: str) -> UserModel:
    user = UserModel(username=username, email=email, password="hashed")
    db.session.add(user)
    db.session.commit()
    return user


def _create_tag(name: str) -> TagModel:
    tag = TagModel(name=name)
    db.session.add(tag)
    db.session.commit()
    return tag


def _create_task(user_id: int, tag_id: int, title: str = "Task", status=TaskStatus.PENDING) -> TaskModel:
    task = TaskModel(
        title=title,
        content="content",
        status=status,
        priority=TaskPriority.MEDIUM,
        user_id=user_id,
        tag_id=tag_id,
    )
    db.session.add(task)
    db.session.commit()
    return task


def test_get_tasks_for_user_returns_only_own_tasks(app):
    with app.app_context():
        user1 = _create_user("user1", "user1@example.com")
        user2 = _create_user("user2", "user2@example.com")
        tag = _create_tag("tag1")

        task1 = _create_task(user1.id, tag.id, title="u1-task")
        _create_task(user2.id, tag.id, title="u2-task")

        rows = TaskService.get_tasks_for_user(user1.id)

        assert len(rows) == 1
        row = rows[0]
        # first column is TaskModel.id
        assert row[0] == task1.id


def test_update_task_forbidden_for_other_user(app):
    with app.app_context():
        owner = _create_user("owner", "owner@example.com")
        other = _create_user("other", "other@example.com")
        tag = _create_tag("tag1")
        task = _create_task(owner.id, tag.id, title="original")

        update_data = {
            "title": "updated",
            "content": "updated content",
            "status": TaskStatus.IN_PROGRESS,
            "priority": "HIGH",
        }

        try:
            TaskService.update_task_for_user(other.id, task.id, update_data)
            raised = False
        except ForbiddenTaskAccess:
            raised = True

        assert raised is True


def test_delete_task_not_found_raises(app):
    with app.app_context():
        user = _create_user("user", "user@example.com")

        try:
            TaskService.delete_task_for_user(user.id, task_id=9999)
            raised = False
        except TaskNotFound:
            raised = True

        assert raised is True

