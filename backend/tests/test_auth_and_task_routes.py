from flask_jwt_extended import create_access_token

from flaskr.db import db
from flaskr.models.tag_model import TagModel
from flaskr.models.user_model import UserModel
from flaskr.utils import generate_password


def _create_user_with_password(email: str, username: str, password: str) -> UserModel:
    user = UserModel(
        username=username,
        email=email,
        password=generate_password(password),
    )
    db.session.add(user)
    db.session.commit()
    return user


def _create_tag(name: str) -> TagModel:
    tag = TagModel(name=name)
    db.session.add(tag)
    db.session.commit()
    return tag


def _auth_header_for_user(user: UserModel):
    token = create_access_token(identity=str(user.id))
    return {"Authorization": f"Bearer {token}"}


def test_sign_in_and_task_crud_flow(app, client):
    with app.app_context():
        # seed user + tag
        raw_password = "secret123"
        user = _create_user_with_password(
            email="test@example.com",
            username="testuser",
            password=raw_password,
        )
        tag = _create_tag("tag1")

        # sign in to get token through API
        resp = client.post(
            "/api/v1/auth/sign-in",
            json={"email": user.email, "password": raw_password},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "token" in data
        token = data["token"]

        headers = {"Authorization": f"Bearer {token}"}

        # create task
        create_resp = client.post(
            "/api/v1/tasks",
            json={
                "title": "My Task",
                "content": "Some content",
                "status": "PENDING",
                "priority": "MEDIUM",
                "tagId": tag.id,
            },
            headers=headers,
        )
        assert create_resp.status_code == 201

        # list tasks for user
        list_resp = client.get("/api/v1/tasks/user", headers=headers)
        assert list_resp.status_code == 200
        tasks = list_resp.get_json()
        assert isinstance(tasks, list)
        assert len(tasks) == 1
        task = tasks[0]
        assert task["title"] == "My Task"
        assert task["tagName"] == tag.name

