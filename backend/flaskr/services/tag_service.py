from typing import List

from sqlalchemy.exc import SQLAlchemyError

from flaskr.db import db
from flaskr.models.tag_model import TagModel
from flaskr.repositories.tag_repository import TagRepository


class TagConflict(Exception):
    pass


class TagService:
    @staticmethod
    def list_tags(limit: int = 15) -> List[TagModel]:
        session = db.session
        return TagRepository.list_all(session, limit=limit)

    @staticmethod
    def create_tag(data: dict) -> None:
        session = db.session

        try:
            existing = TagRepository.get_by_name(session, data["name"])
            if existing:
                raise TagConflict()

            new_tag = TagModel(**data)
            TagRepository.add(session, new_tag)
            session.commit()
        except TagConflict:
            raise
        except SQLAlchemyError:
            session.rollback()
            raise

