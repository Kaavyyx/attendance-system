from datetime import datetime, timedelta, timezone
from typing import Optional

from flask import current_app
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from models import Branch, User, UserRole


class AuthService:
    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _validate_password(password: str) -> tuple[bool, Optional[str]]:
        if not password or len(password) < 8:
            return False, "Password must be at least 8 characters long."
        if not any(char.isupper() for char in password):
            return False, "Password must include at least one uppercase letter."
        if not any(char.isdigit() for char in password):
            return False, "Password must include at least one number."
        return True, None

    @classmethod
    def register_user(cls, data: dict) -> tuple[Optional[User], Optional[str], Optional[int]]:
        full_name = (data.get("full_name") or "").strip()
        employee_id = (data.get("employee_id") or "").strip()
        email = cls._normalize_email(data.get("email") or "")
        phone = (data.get("phone") or "").strip()
        password = (data.get("password") or "")
        branch_id = data.get("branch_id")
        requested_role = (data.get("role") or "EMPLOYEE").strip().upper()

        if not full_name:
            return None, "Full name is required.", 400
        if not employee_id:
            return None, "Employee ID is required.", 400
        if not email:
            return None, "Email is required.", 400
        if not phone:
            return None, "Phone number is required.", 400
        if not password:
            return None, "Password is required.", 400
        if branch_id in (None, ""):
            return None, "Branch selection is required.", 400

        valid_password, password_error = cls._validate_password(password)
        if not valid_password:
            return None, password_error, 400

        if requested_role != "EMPLOYEE":
            return None, "Admin role cannot be self-assigned during registration.", 400

        if User.query.filter_by(employee_id=employee_id).first():
            return None, "Employee ID already exists.", 409

        if User.query.filter_by(email=email).first():
            return None, "Email already exists.", 409

        branch = Branch.query.get(branch_id)
        if not branch:
            return None, "Selected branch does not exist.", 404
        if not branch.is_active:
            return None, "Selected branch is inactive.", 400

        user = User(
            full_name=full_name,
            employee_id=employee_id,
            email=email,
            phone=phone,
            password_hash=generate_password_hash(password),
            role=UserRole.EMPLOYEE,
            branch_id=branch.id,
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        return user, None, None

    @classmethod
    def authenticate_user(cls, identifier: str, password: str) -> tuple[Optional[User], Optional[str], Optional[int]]:
        identifier = (identifier or "").strip()
        password = password or ""
        if not identifier or not password:
            return None, "Email/Employee ID and password are required.", 400

        user = User.query.filter((User.email == identifier.lower()) | (User.employee_id == identifier)).first()
        if not user:
            return None, "Invalid credentials.", 401
        if not user.is_active:
            return None, "Account is inactive.", 403
        if not check_password_hash(user.password_hash, password):
            return None, "Invalid credentials.", 401
        return user, None, None

    @staticmethod
    def create_token(user: User) -> str:
        expires = timedelta(hours=8)
        return create_access_token(identity=str(user.id), expires_delta=expires)

    @staticmethod
    def safe_user_payload(user: User) -> dict:
        branch_summary = None
        if user.branch:
            branch_summary = {
                "id": user.branch.id,
                "branch_name": user.branch.branch_name,
                "branch_code": user.branch.branch_code,
            }
        return {
            "id": user.id,
            "full_name": user.full_name,
            "employee_id": user.employee_id,
            "email": user.email,
            "phone": user.phone,
            "role": user.role.value,
            "is_active": user.is_active,
            "branch": branch_summary,
        }
