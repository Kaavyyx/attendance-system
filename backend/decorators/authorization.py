from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from models import User, UserRole


def require_role(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(int(current_user_id))
            if not user or not user.is_active:
                return jsonify({"error": "Account is inactive."}), 403
            if user.role not in roles:
                return jsonify({"error": "Forbidden."}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator
