from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from decorators.authorization import require_role
from models import User

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.route("/dashboard", methods=["GET"])
@jwt_required()
@require_role("ADMIN")
def dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({
        "message": "Admin dashboard access granted.",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "role": user.role.value,
        },
    }), 200
