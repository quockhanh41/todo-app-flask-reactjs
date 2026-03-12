from flask_smorest import abort

from flaskr.services.tag_service import TagConflict, TagService


class TagController:
    @staticmethod
    def get_all():
        try:
            return TagService.list_tags()
        except Exception:
            abort(500, message="Internal server error while fetching tags")

    @staticmethod
    def create(data):
        try:
            TagService.create_tag(data)
        except TagConflict:
            abort(409, message="Tag already registered")
        except Exception:
            abort(500, message="Internal server error while creating tag")
