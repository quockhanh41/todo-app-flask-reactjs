from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from flaskr.models.tag_model import TagModel


class TagRepository:
    @staticmethod
    def list_all(session: Session, limit: int = 15) -> List[TagModel]:
        return session.execute(select(TagModel).limit(limit)).scalars().all()

    @staticmethod
    def get_by_name(session: Session, name: str) -> Optional[TagModel]:
        return session.execute(
            select(TagModel).where(TagModel.name == name)
        ).scalar_one_or_none()

    @staticmethod
    def add(session: Session, tag: TagModel) -> None:
        session.add(tag)

