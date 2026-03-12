"""
One-time migration script: copy data from existing SQLite database (data.db)
to a PostgreSQL database defined by DATABASE_URL.

Usage (run from backend directory, with venv activated and requirements installed):
    python -m scripts.migrate_sqlite_to_postgres
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from flaskr.models.tag_model import TagModel
from flaskr.models.task_model import TaskModel
from flaskr.models.user_model import UserModel


basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

SQLITE_URL = "sqlite:///" + os.path.join(basedir, "data.db")
POSTGRES_URL = os.getenv("DATABASE_URL")


def get_sqlite_session():
    engine = create_engine(SQLITE_URL)
    return sessionmaker(bind=engine)()


def get_postgres_session():
    if not POSTGRES_URL:
        raise RuntimeError("DATABASE_URL env var must be set to PostgreSQL URL")

    engine = create_engine(POSTGRES_URL)
    return sessionmaker(bind=engine)()


def migrate():
    src = get_sqlite_session()
    dst = get_postgres_session()

    try:
        # 1) Users
        users = src.query(UserModel).all()
        for user in users:
            dst.merge(
                UserModel(
                    id=user.id,
                    username=user.username,
                    email=user.email,
                    password=user.password,
                )
            )
        dst.flush()

        # 2) Tags
        tags = src.query(TagModel).all()
        for tag in tags:
            dst.merge(
                TagModel(
                    id=tag.id,
                    name=tag.name,
                )
            )
        dst.flush()

        # 3) Tasks
        tasks = src.query(TaskModel).all()
        for task in tasks:
            dst.merge(
                TaskModel(
                    id=task.id,
                    title=task.title,
                    content=task.content,
                    status=task.status,
                    created_at=task.created_at,
                    user_id=task.user_id,
                    tag_id=task.tag_id,
                )
            )

        dst.commit()
    except Exception:
        dst.rollback()
        raise
    finally:
        src.close()
        dst.close()


if __name__ == "__main__":
    migrate()

