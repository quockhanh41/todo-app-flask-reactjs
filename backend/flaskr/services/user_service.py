from typing import List

from sqlalchemy.exc import NoResultFound, SQLAlchemyError

from flaskr.db import db
from flaskr.models.user_model import UserModel
from flaskr.repositories.user_repository import UserRepository
from flaskr.utils import generate_password


class UserNotFound(Exception):
    pass


class UserConflict(Exception):
    def __init__(self, field: str) -> None:
        self.field = field


class UserService:
    @staticmethod
    def list_users() -> List[UserModel]:
        session = db.session
        return UserRepository.list_all(session)

    @staticmethod
    def get_user_by_id(user_id: int) -> UserModel:
        session = db.session

        user = UserRepository.get_by_id(session, user_id)
        if user is None:
            raise UserNotFound()

        return user

    @staticmethod
    def create_user(data: dict) -> None:
        session = db.session

        try:
            existing = UserRepository.get_by_username_or_email(
                session, data["username"], data["email"]
            )

            if existing:
                if existing.username == data["username"]:
                    raise UserConflict("username")
                if existing.email == data["email"]:
                    raise UserConflict("email")

            new_user = UserModel(**data)
            new_user.password = generate_password(data["password"])

            UserRepository.add(session, new_user)
            session.commit()
        except (UserConflict,):
            raise
        except SQLAlchemyError:
            session.rollback()
            raise

    @staticmethod
    def delete_current_user(user_id: int) -> None:
        session = db.session

        try:
            user = UserRepository.get_by_id(session, user_id)
            if user is None:
                raise UserNotFound()

            UserRepository.delete(session, user)
            session.commit()
        except (UserNotFound,):
            raise
        except (NoResultFound, SQLAlchemyError):
            session.rollback()
            raise

