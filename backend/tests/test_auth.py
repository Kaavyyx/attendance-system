import os
import sys
from datetime import date, datetime
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("FLASK_ENV", "testing")

from create_app import create_app
from extensions import db
from models import Attendance, AttendanceStatus, Branch, User, UserRole
from werkzeug.security import generate_password_hash


@pytest.fixture()
def client():
    app = create_app()
    app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI=os.getenv("TEST_DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/geoface_attendance"))
    with app.app_context():
        db.drop_all()
        db.create_all()
        branch = Branch(branch_name="Test Branch", branch_code="TEST-BR", address="Test", latitude=1.0, longitude=2.0, allowed_radius_meters=100, is_active=True)
        db.session.add(branch)
        db.session.commit()
        admin = User(full_name="Admin User", employee_id="ADMIN-TEST", email="admin@example.com", phone="123", password_hash=generate_password_hash("AdminPass123"), role=UserRole.ADMIN, branch_id=branch.id, is_active=True)
        employee = User(full_name="Employee User", employee_id="EMP-001", email="employee@example.com", phone="456", password_hash=generate_password_hash("EmployeePass123"), role=UserRole.EMPLOYEE, branch_id=branch.id, is_active=True)
        other_employee = User(full_name="Other User", employee_id="EMP-002", email="other@example.com", phone="789", password_hash=generate_password_hash("OtherPass123"), role=UserRole.EMPLOYEE, branch_id=branch.id, is_active=True)
        db.session.add_all([admin, employee, other_employee])
        db.session.flush()
        attendance = Attendance(employee_id=employee.id, branch_id=branch.id, attendance_date=date(2026, 7, 1), check_in_time=datetime(2026, 7, 1, 8, 30), check_out_time=datetime(2026, 7, 1, 17, 0), status=AttendanceStatus.PRESENT)
        other_attendance = Attendance(employee_id=other_employee.id, branch_id=branch.id, attendance_date=date(2026, 7, 2), check_in_time=datetime(2026, 7, 2, 8, 45), check_out_time=datetime(2026, 7, 2, 18, 0), status=AttendanceStatus.PRESENT)
        db.session.add_all([attendance, other_attendance])
        db.session.commit()
    with app.test_client() as client:
        yield client
    with app.app_context():
        db.drop_all()


def test_successful_registration(client):
    response = client.post("/api/auth/register", json={
        "full_name": "New User",
        "employee_id": "EMP-100",
        "email": "new@example.com",
        "phone": "999",
        "password": "Password123",
        "branch_id": 1,
    })
    assert response.status_code == 201


def test_active_branches_endpoint(client):
    response = client.get("/api/branches")
    assert response.status_code == 200
    payload = response.get_json()
    assert "branches" in payload
    assert len(payload["branches"]) >= 1


def test_duplicate_email_rejection(client):
    response = client.post("/api/auth/register", json={
        "full_name": "Duplicate",
        "employee_id": "EMP-200",
        "email": "employee@example.com",
        "phone": "999",
        "password": "Password123",
        "branch_id": 1,
    })
    assert response.status_code == 409


def test_duplicate_employee_id_rejection(client):
    response = client.post("/api/auth/register", json={
        "full_name": "Duplicate",
        "employee_id": "EMP-001",
        "email": "new2@example.com",
        "phone": "999",
        "password": "Password123",
        "branch_id": 1,
    })
    assert response.status_code == 409


def test_invalid_branch_rejection(client):
    response = client.post("/api/auth/register", json={
        "full_name": "Bad Branch",
        "employee_id": "EMP-300",
        "email": "bad@example.com",
        "phone": "999",
        "password": "Password123",
        "branch_id": 999,
    })
    assert response.status_code == 404


def test_employee_cannot_self_register_as_admin(client):
    response = client.post("/api/auth/register", json={
        "full_name": "Sneaky",
        "employee_id": "EMP-400",
        "email": "sneaky@example.com",
        "phone": "999",
        "password": "Password123",
        "branch_id": 1,
        "role": "ADMIN",
    })
    assert response.status_code == 400


def test_login_by_email(client):
    response = client.post("/api/auth/login", json={"identifier": "employee@example.com", "password": "EmployeePass123"})
    assert response.status_code == 200
    assert "access_token" in response.get_json()


def test_login_by_employee_id(client):
    response = client.post("/api/auth/login", json={"identifier": "EMP-001", "password": "EmployeePass123"})
    assert response.status_code == 200


def test_invalid_password_rejection(client):
    response = client.post("/api/auth/login", json={"identifier": "employee@example.com", "password": "wrong"})
    assert response.status_code == 401


def test_me_without_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_with_token(client):
    login_response = client.post("/api/auth/login", json={"identifier": "employee@example.com", "password": "EmployeePass123"})
    token = login_response.get_json()["access_token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_employee_forbidden_from_admin_route(client):
    login_response = client.post("/api/auth/login", json={"identifier": "employee@example.com", "password": "EmployeePass123"})
    token = login_response.get_json()["access_token"]
    response = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_admin_allowed_on_admin_route(client):
    login_response = client.post("/api/auth/login", json={"identifier": "admin@example.com", "password": "AdminPass123"})
    token = login_response.get_json()["access_token"]
    response = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_attendance_history_returns_only_authenticated_employee_records(client):
    login_response = client.post("/api/auth/login", json={"identifier": "employee@example.com", "password": "EmployeePass123"})
    token = login_response.get_json()["access_token"]
    response = client.get("/api/attendance/history", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    payload = response.get_json()
    assert len(payload["records"]) == 1
    assert payload["records"][0]["attendance_date"] == "2026-07-01"


def test_monthly_summary_returns_only_authenticated_employee_metrics(client):
    login_response = client.post("/api/auth/login", json={"identifier": "employee@example.com", "password": "EmployeePass123"})
    token = login_response.get_json()["access_token"]
    response = client.get("/api/attendance/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["summary"]["total_attendance_days"] == 1
    assert payload["summary"]["present_days"] == 1


def test_empty_attendance_history_and_summary_for_employee_without_records(client):
    with client.application.app_context():
        employee = User(full_name="No Records", employee_id="EMP-003", email="norecords@example.com", phone="000", password_hash=generate_password_hash("NoRecords123"), role=UserRole.EMPLOYEE, branch_id=1, is_active=True)
        db.session.add(employee)
        db.session.commit()

    login_response = client.post("/api/auth/login", json={"identifier": "norecords@example.com", "password": "NoRecords123"})
    token = login_response.get_json()["access_token"]

    history_response = client.get("/api/attendance/history", headers={"Authorization": f"Bearer {token}"})
    summary_response = client.get("/api/attendance/summary", headers={"Authorization": f"Bearer {token}"})
    assert history_response.status_code == 200
    assert summary_response.status_code == 200
    assert history_response.get_json()["records"] == []
    assert summary_response.get_json()["summary"]["total_attendance_days"] == 0
    assert summary_response.get_json()["summary"]["present_days"] == 0


def test_mark_attendance_checks_in_inside_geofence(client):
    login_response = client.post("/api/auth/login", json={"identifier": "employee@example.com", "password": "EmployeePass123"})
    token = login_response.get_json()["access_token"]
    response = client.post("/api/attendance/mark", headers={"Authorization": f"Bearer {token}"}, json={"latitude": 1.0, "longitude": 2.0})
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["inside_geofence"] is True
    assert payload["checked_in"] is True

    with client.application.app_context():
        user = User.query.filter_by(email="employee@example.com").first()
        attendance = Attendance.query.filter_by(employee_id=user.id, attendance_date=date.today()).first()
        assert attendance is not None
        assert attendance.status == AttendanceStatus.PRESENT


def test_mark_attendance_rejects_outside_geofence(client):
    login_response = client.post("/api/auth/login", json={"identifier": "employee@example.com", "password": "EmployeePass123"})
    token = login_response.get_json()["access_token"]
    response = client.post("/api/attendance/mark", headers={"Authorization": f"Bearer {token}"}, json={"latitude": 40.0, "longitude": 40.0})
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["inside_geofence"] is False
    assert payload["checked_in"] is False
    assert payload["current_distance_meters"] > 0
