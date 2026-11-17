from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from extensions import db
from models import Branch, User, UserRole
from services.auth_service import AuthService

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.errorhandler(400)
@bp.errorhandler(404)
@bp.errorhandler(405)
@bp.errorhandler(500)
def handle_http_errors(error):
    return jsonify({"error": error.description or "Request failed."}), error.code


@bp.route("/register", methods=["POST"])
def register():
    try:
        payload = request.get_json(silent=True) or {}
    except Exception:
        return jsonify({"error": "Malformed JSON."}), 400

    user, error, status = AuthService.register_user(payload)
    if error:
        return jsonify({"error": error}), status or 400

    return jsonify({
        "message": "Registration successful.",
        "user": AuthService.safe_user_payload(user),
    }), 201


@bp.route("/login", methods=["POST"])
def login():
    try:
        payload = request.get_json(silent=True) or {}
    except Exception:
        return jsonify({"error": "Malformed JSON."}), 400

    identifier = (payload.get("identifier") or payload.get("email") or payload.get("employee_id") or "").strip()
    password = payload.get("password") or ""
    user, error, status = AuthService.authenticate_user(identifier, password)
    if error:
        return jsonify({"error": error}), status or 401

    token = AuthService.create_token(user)
    return jsonify({
        "access_token": token,
        "user": AuthService.safe_user_payload(user),
    }), 200


@bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found."}), 404
    if not user.is_active:
        return jsonify({"error": "Account is inactive."}), 403
    return jsonify({"user": AuthService.safe_user_payload(user)}), 200
