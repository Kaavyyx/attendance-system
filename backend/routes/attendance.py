from __future__ import annotations

import math
from calendar import monthrange
from datetime import date, datetime, timezone, timedelta

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import get_jwt_identity, jwt_required
from itsdangerous import URLSafeTimedSerializer

from extensions import db
from models import Attendance, AttendanceStatus, User, AttendanceAttempt

bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")


def _calculate_distance_meters(lat1, lon1, lat2, lon2):
    radius = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def get_serializer(app):
    return URLSafeTimedSerializer(app.config["SECRET_KEY"])


@bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found."}), 404
    if not user.is_active:
        return jsonify({"error": "Account is inactive."}), 403

    records = (
        Attendance.query.filter_by(employee_id=user.id)
        .order_by(Attendance.attendance_date.desc(), Attendance.created_at.desc())
        .all()
    )

    payload = {
        "records": [
            {
                "id": record.id,
                "attendance_date": record.attendance_date.isoformat() if record.attendance_date else None,
                "check_in_time": record.check_in_time.isoformat() if record.check_in_time else None,
                "check_out_time": record.check_out_time.isoformat() if record.check_out_time else None,
                "status": record.status.value if record.status else None,
            }
            for record in records
        ]
    }
    return jsonify(payload), 200


@bp.route("/mark", methods=["POST"])
@jwt_required()
def mark_attendance():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found."}), 404
    if not user.is_active:
        return jsonify({"error": "Account is inactive."}), 403
    if not user.branch:
        return jsonify({"error": "No assigned branch was found for your account."}), 404

    payload = request.get_json(silent=True) or {}
    try:
        latitude = float(payload.get("latitude"))
        longitude = float(payload.get("longitude"))
    except (TypeError, ValueError):
        return jsonify({"error": "Location coordinates are required."}), 400

    if user.branch.latitude is None or user.branch.longitude is None:
        return jsonify({"error": "The assigned branch does not have valid coordinates."}), 400

    current_distance_meters = _calculate_distance_meters(
        latitude,
        longitude,
        user.branch.latitude,
        user.branch.longitude,
    )
    inside_geofence = current_distance_meters <= float(user.branch.allowed_radius_meters)

    if not inside_geofence:
        return jsonify(
            {
                "checked_in": False,
                "inside_geofence": False,
                "current_distance_meters": round(current_distance_meters, 2),
                "allowed_radius_meters": user.branch.allowed_radius_meters,
                "branch_name": user.branch.branch_name,
                "message": "You are outside the allowed geofence for your assigned branch.",
            }
        ), 200

    today = date.today()
    existing_attendance = Attendance.query.filter_by(employee_id=user.id, attendance_date=today).first()
    if existing_attendance:
        return jsonify(
            {
                "checked_in": False,
                "inside_geofence": True,
                "current_distance_meters": round(current_distance_meters, 2),
                "allowed_radius_meters": user.branch.allowed_radius_meters,
                "branch_name": user.branch.branch_name,
                "message": "You have already checked in for today.",
            }
        ), 200

    # Create attendance attempt
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    attempt = AttendanceAttempt(
        employee_id=user.id,
        attempt_type="check-in",
        location_verified=True,
        face_verified=False,
        calculated_distance_meters=current_distance_meters,
        latitude=latitude,
        longitude=longitude,
        expires_at=expires_at
    )
    db.session.add(attempt)
    db.session.commit()

    # Create signed challenge
    serializer = get_serializer(current_app)
    challenge = serializer.dumps({
        "purpose": "face_verification",
        "employee_id": user.id,
        "attempt_id": attempt.id
    })

    return jsonify(
        {
            "checked_in": False,
            "inside_geofence": True,
            "current_distance_meters": round(current_distance_meters, 2),
            "allowed_radius_meters": user.branch.allowed_radius_meters,
            "branch_name": user.branch.branch_name,
            "message": "Location verified. Please complete face verification to check in.",
            "challenge": challenge,
            "expires_at": expires_at.isoformat()
        }
    ), 200


@bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found."}), 404
    if not user.is_active:
        return jsonify({"error": "Account is inactive."}), 403

    today = datetime.now(timezone.utc).date()
    month_start = today.replace(day=1)
    last_day = monthrange(today.year, today.month)[1]
    month_end = today.replace(day=last_day)

    records = (
        Attendance.query.filter(
            Attendance.employee_id == user.id,
            Attendance.attendance_date >= month_start,
            Attendance.attendance_date <= month_end,
        )
        .all()
    )

    summary = {
        "month": today.strftime("%Y-%m"),
        "total_attendance_days": len(records),
        "present_days": sum(1 for record in records if record.status == AttendanceStatus.PRESENT),
    }

    if any(record.status == AttendanceStatus.LATE for record in records):
        summary["late_days"] = sum(1 for record in records if record.status == AttendanceStatus.LATE)
    if any(record.status == AttendanceStatus.ABSENT for record in records):
        summary["absent_days"] = sum(1 for record in records if record.status == AttendanceStatus.ABSENT)

    return jsonify({"summary": summary}), 200
