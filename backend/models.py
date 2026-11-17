from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import relationship

from extensions import db


class UserRole(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    ADMIN = "ADMIN"


class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    LATE = "LATE"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"


class Branch(db.Model):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True)
    branch_name = Column(String(120), nullable=False)
    branch_code = Column(String(60), nullable=False, unique=True)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    allowed_radius_meters = Column(Integer, nullable=False, default=100)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    employees = relationship("User", back_populates="branch", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="branch")

    __table_args__ = (
        Index("ix_branches_active", "is_active"),
        Index("ix_branches_code", "branch_code"),
    )


class User(db.Model):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(120), nullable=False)
    employee_id = Column(String(60), nullable=False, unique=True)
    email = Column(String(180), nullable=False, unique=True)
    phone = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    profile_image_path = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    branch = relationship("Branch", back_populates="employees")
    face_template = relationship("FaceTemplate", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="employee")
    attendance_attempts = relationship("AttendanceAttempt", back_populates="employee")
    verification_attempts = relationship("VerificationAttempt", back_populates="employee")

    __table_args__ = (
        Index("ix_users_role", "role"),
        Index("ix_users_active", "is_active"),
        Index("ix_users_branch_id", "branch_id"),
    )


class FaceTemplate(db.Model):
    __tablename__ = "face_templates"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    embedding = Column(Text, nullable=False)
    model_name = Column(String(80), nullable=False, default="demo-face-embedding")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("User", back_populates="face_template")

    __table_args__ = (
        Index("ix_face_templates_employee", "employee_id"),
    )


class Attendance(db.Model):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    attendance_date = Column(Date, nullable=False)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    check_in_latitude = Column(Float, nullable=True)
    check_in_longitude = Column(Float, nullable=True)
    check_out_latitude = Column(Float, nullable=True)
    check_out_longitude = Column(Float, nullable=True)
    check_in_distance_meters = Column(Float, nullable=True)
    check_out_distance_meters = Column(Float, nullable=True)
    location_verified = Column(Boolean, nullable=False, default=False)
    face_verified = Column(Boolean, nullable=False, default=False)
    status = Column(SAEnum(AttendanceStatus), nullable=False, default=AttendanceStatus.PRESENT)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("User", back_populates="attendances")
    branch = relationship("Branch", back_populates="attendances")

    __table_args__ = (
        UniqueConstraint("employee_id", "attendance_date", name="uq_attendance_employee_date"),
        Index("ix_attendance_employee_date", "employee_id", "attendance_date"),
        Index("ix_attendance_branch_date", "branch_id", "attendance_date"),
    )


class AttendanceAttempt(db.Model):
    __tablename__ = "attendance_attempts"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    attempt_type = Column(String(30), nullable=False, default="check-in")
    location_verified = Column(Boolean, nullable=False, default=False)
    face_verified = Column(Boolean, nullable=False, default=False)
    calculated_distance_meters = Column(Float, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    consumed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    employee = relationship("User", back_populates="attendance_attempts")

    __table_args__ = (
        Index("ix_attempts_employee_expires", "employee_id", "expires_at"),
        Index("ix_attempts_consumed", "consumed_at"),
    )


class VerificationAttempt(db.Model):
    __tablename__ = "verification_attempts"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verification_type = Column(String(30), nullable=False, default="face")
    success = Column(Boolean, nullable=False, default=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    employee = relationship("User", back_populates="verification_attempts")

    __table_args__ = (
        Index("ix_verification_employee", "employee_id", "created_at"),
    )
