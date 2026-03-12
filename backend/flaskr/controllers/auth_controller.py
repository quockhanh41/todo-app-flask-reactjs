from flask_smorest import abort

from flaskr.services.auth_service import AuthService, InvalidCredentials


class AuthController:
    @staticmethod
    def sign_in(data):
        try:
            return AuthService.sign_in(data)
        except InvalidCredentials:
            abort(401, message="Incorrect credentials")
        except Exception:
            abort(500, message="Internal server error while sign in")
