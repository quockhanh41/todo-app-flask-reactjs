from datetime import datetime, timedelta, timezone

from flask_jwt_extended import create_access_token

from flaskr.db import db
from flaskr.models.tag_model import TagModel
from flaskr.models.task_model import TaskModel, TaskPriority, TaskStatus
from flaskr.models.user_model import UserModel


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


def _create_task(
    *,
    user_id: int,
    tag_id: int,
    title: str,
    status: TaskStatus,
    deadline,
) -> TaskModel:
    task = TaskModel(
        title=title,
        content="content",
        status=status,
        priority=TaskPriority.MEDIUM,
        deadline=deadline,
        user_id=user_id,
        tag_id=tag_id,
    )
    db.session.add(task)
    db.session.commit()
    return task


def test_get_notifications_creates_due_soon_and_overdue_without_duplicates(app, client):
    with app.app_context():
        user = _create_user("user1", "user1@example.com")
        tag = _create_tag("work")

        _create_task(
            user_id=user.id,
            tag_id=tag.id,
            title="Due soon task",
            status=TaskStatus.PENDING,
            deadline=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
        _create_task(
            user_id=user.id,
            tag_id=tag.id,
            title="Overdue task",
            status=TaskStatus.PENDING,
            deadline=datetime.now(timezone.utc) - timedelta(minutes=5),
        )

        token = create_access_token(identity=str(user.id))
        headers = {"Authorization": f"Bearer {token}"}

        first_resp = client.get("/api/v1/notifications", headers=headers)
        assert first_resp.status_code == 200
        first_data = first_resp.get_json()
        assert first_data["unreadCount"] == 2
        assert len(first_data["items"]) == 2

        second_resp = client.get("/api/v1/notifications", headers=headers)
        assert second_resp.status_code == 200
        second_data = second_resp.get_json()
        assert second_data["unreadCount"] == 2
        assert len(second_data["items"]) == 2


def test_completed_task_notifications_do_not_count_in_unread_badge(app, client):
    with app.app_context():
        user = _create_user("user2", "user2@example.com")
        tag = _create_tag("home")

        _create_task(
            user_id=user.id,
            tag_id=tag.id,
            title="Completed overdue",
            status=TaskStatus.COMPLETED,
            deadline=datetime.now(timezone.utc) - timedelta(minutes=20),
        )
        _create_task(
            user_id=user.id,
            tag_id=tag.id,
            title="Pending overdue",
            status=TaskStatus.PENDING,
            deadline=datetime.now(timezone.utc) - timedelta(minutes=20),
        )

        token = create_access_token(identity=str(user.id))
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/api/v1/notifications", headers=headers)
        assert resp.status_code == 200
        data = resp.get_json()

        assert data["unreadCount"] == 1
        assert len(data["items"]) == 1


def test_mark_notification_as_read_and_mark_all(app, client):
    with app.app_context():
        user = _create_user("user3", "user3@example.com")
        tag = _create_tag("misc")

        _create_task(
            user_id=user.id,
            tag_id=tag.id,
            title="Due soon task",
            status=TaskStatus.PENDING,
            deadline=datetime.now(timezone.utc) + timedelta(minutes=15),
        )
        _create_task(
            user_id=user.id,
            tag_id=tag.id,
            title="Overdue task",
            status=TaskStatus.PENDING,
            deadline=datetime.now(timezone.utc) - timedelta(minutes=15),
        )

        token = create_access_token(identity=str(user.id))
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/api/v1/notifications", headers=headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["unreadCount"] == 2

        first_id = data["items"][0]["id"]

        mark_one_resp = client.patch(f"/api/v1/notifications/{first_id}/read", headers=headers)
        assert mark_one_resp.status_code == 204

        after_mark_one_resp = client.get("/api/v1/notifications", headers=headers)
        after_mark_one = after_mark_one_resp.get_json()
        assert after_mark_one["unreadCount"] == 1

        mark_all_resp = client.patch("/api/v1/notifications/read-all", headers=headers)
        assert mark_all_resp.status_code == 204

        after_mark_all_resp = client.get("/api/v1/notifications", headers=headers)
        after_mark_all = after_mark_all_resp.get_json()
        assert after_mark_all["unreadCount"] == 0
