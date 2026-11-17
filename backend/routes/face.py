
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, timezone
from itsdangerous import URLSafeTimedSerializer, BadData

from extensions import db
from models import User, FaceTemplate, AttendanceAttempt, VerificationAttempt, Attendance, AttendanceStatus
from services.face_client import check_service_available, extract_embedding, compare_embedding, FaceServiceError


bp = Blueprint("face", __name__, url_prefix="/api/face")


def get_serializer(app):
    return URLSafeTimedSerializer(app.config["SECRET_KEY"])


@bp.route("/enroll", methods=["POST"])
@jwt_required()
def enroll():
    if not check_service_available():
        return jsonify({
            "error": "Face recognition service is unavailable."
        }), 503

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found."}), 404
    if not user.is_active:
        return jsonify({"error": "Account is inactive."}), 403

    if "image" not in request.files:
        return jsonify({"error": "Image file is required."}), 400
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No image selected."}), 400

    try:
        image_bytes = file.read()
        embedding_list, model_name = extract_embedding(image_bytes)
        import json
        embedding_str = json.dumps(embedding_list)

        existing_template = FaceTemplate.query.filter_by(employee_id=user.id).first()
        if existing_template:
            existing_template.embedding = embedding_str
            existing_template.model_name = model_name
            db.session.commit()
            return jsonify({
                "message": "Face enrollment updated successfully.",
                "enrolled": True
            }), 200
        else:
            template = FaceTemplate(
                employee_id=user.id,
                embedding=embedding_str,
                model_name=model_name
            )
            db.session.add(template)
            db.session.commit()
            return jsonify({
                "message": "Face enrolled successfully.",
                "enrolled": True
            }), 200
    except FaceServiceError as e:
        return jsonify({"error": str(e)}), 503
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "An error occurred while processing your image. Please try again."}), 500


@bp.route("/status", methods=["GET"])
@jwt_required()
def status():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found."}), 404
    if not user.is_active:
        return jsonify({"error": "Account is inactive."}), 403

    template = FaceTemplate.query.filter_by(employee_id=user.id).first()
    return jsonify({
        "enrolled": template is not None,
        "model_name": template.model_name if template else None,
        "updated_at": template.updated_at.isoformat() if template else None,
        "service_available": check_service_available()
    }), 200


@bp.route("/verify", methods=["POST"])
@jwt_required()
def verify():
    from flask import current_app
    if not check_service_available():
        return jsonify({"error": "Face recognition service is unavailable."}), 503

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found."}), 404
    if not user.is_active:
        return jsonify({"error": "Account is inactive."}), 403
    if not user.branch:
        return jsonify({"error": "No assigned branch found."}), 400

    if "image" not in request.files:
        return jsonify({"error": "Image file is required."}), 400
    if "challenge" not in request.form:
        return jsonify({"error": "Challenge is required."}), 400
    file = request.files["image"]
    challenge = request.form["challenge"]

    # Verify challenge
    serializer = get_serializer(current_app)
    try:
        data = serializer.loads(challenge, max_age=300)  # 5 minutes
    except BadData:
        return jsonify({"error": "Invalid or expired challenge."}), 400

    if data.get("purpose") != "face_verification":
        return jsonify({"error": "Invalid challenge purpose."}), 400
    if str(data.get("employee_id")) != str(user.id):
        return jsonify({"error": "Challenge does not belong to this user."}), 400

    attempt_id = data.get("attempt_id")
    attempt = AttendanceAttempt.query.get(attempt_id)
    if not attempt:
        return jsonify({"error": "Attempt not found."}), 404
    if attempt.employee_id != user.id:
        return jsonify({"error": "Attempt does not belong to this user."}), 403
    if attempt.consumed_at is not None:
        return jsonify({"error": "This challenge has already been used."}), 400
    if not attempt.location_verified:
        return jsonify({"error": "Location was not verified for this attempt."}), 400
    # Normalize expires_at to UTC-aware datetime
    expires_at = attempt.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        return jsonify({"error": "Challenge has expired."}), 400

    # Check if user has face template
    template = FaceTemplate.query.filter_by(employee_id=user.id).first()
    if not template:
        return jsonify({"error": "Face enrollment required. Please enroll your face first."}), 400

    # Check for existing attendance today
    today = datetime.now(timezone.utc).date()
    existing_attendance = Attendance.query.filter_by(
        employee_id=user.id,
        attendance_date=today
    ).first()
    if existing_attendance:
        attempt.consumed_at = datetime.now(timezone.utc)
        db.session.commit()
        return jsonify({
            "checked_in": False,
            "message": "You have already checked in for today."
        }), 200

    # Compare face
    try:
        import json
        stored_embedding = json.loads(template.embedding)
        image_bytes = file.read()
        matched, similarity, threshold = compare_embedding(image_bytes, stored_embedding)

        # Log verification attempt
        verification = VerificationAttempt(
            employee_id=user.id,
            verification_type="face",
            success=matched,
            reason=None if matched else f"Face mismatch, similarity: {similarity:.4f}"
        )
        db.session.add(verification)

        if not matched:
            attempt.face_verified = False
            db.session.commit()
            return jsonify({
                "checked_in": False,
                "matched": False,
                "similarity": similarity,
                "threshold": threshold,
                "message": "Face not recognized. Please try again."
            }), 200

        # Face matched, create final attendance
        attendance = Attendance(
            employee_id=user.id,
            branch_id=user.branch.id,
            attendance_date=today,
            check_in_time=datetime.now(timezone.utc),
            check_in_latitude=attempt.latitude,
            check_in_longitude=attempt.longitude,
            check_in_distance_meters=attempt.calculated_distance_meters,
            location_verified=True,
            face_verified=True,
            status=AttendanceStatus.PRESENT
        )
        db.session.add(attendance)

        attempt.face_verified = True
        attempt.consumed_at = datetime.now(timezone.utc)
        db.session.commit()

        return jsonify({
            "checked_in": True,
            "matched": True,
            "similarity": similarity,
            "threshold": threshold,
            "message": "Attendance checked in successfully.",
            "branch_name": user.branch.branch_name
        }), 200

    except FaceServiceError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "An error occurred while processing your image. Please try again."}), 500
