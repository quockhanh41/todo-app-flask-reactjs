from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from flaskr.models.user_model import UserModel


class UserRepository:
    @staticmethod
    def list_all(session: Session) -> List[UserModel]:
        return session.execute(select(UserModel)).scalars().all()

    @staticmethod
    def get_by_id(session: Session, user_id: int) -> Optional[UserModel]:
        return session.execute(
            select(UserModel).where(UserModel.id == user_id)
        ).scalar_one_or_none()

    @staticmethod
    def get_by_username_or_email(session: Session, username: str, email: str) -> Optional[UserModel]:
        return session.execute(
            select(UserModel).where(
                (UserModel.username == username) | (UserModel.email == email)
            )
        ).scalar_one_or_none()

    @staticmethod
    def get_by_email(session: Session, email: str) -> Optional[UserModel]:
        return session.execute(
            select(UserModel).where(UserModel.email == email)
        ).scalar_one_or_none()

    @staticmethod
    def add(session: Session, user: UserModel) -> None:
        session.add(user)

    @staticmethod
    def delete(session: Session, user: UserModel) -> None:
        session.delete(user)

