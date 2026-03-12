from sqlalchemy.exc import SQLAlchemyError

from flask_jwt_extended import create_access_token

from flaskr.db import db
from flaskr.repositories.user_repository import UserRepository
from flaskr.utils import check_password


class InvalidCredentials(Exception):
    pass


class AuthService:
    @staticmethod
    def sign_in(data: dict) -> dict:
        session = db.session

        try:
            user = UserRepository.get_by_email(session, data["email"])

            if user is None or not check_password(user.password, data["password"]):
                raise InvalidCredentials()

            token = create_access_token(identity=str(user.id))
            return {"token": token}
        except InvalidCredentials:
            raise
        except SQLAlchemyError:
            session.rollback()
            raise

