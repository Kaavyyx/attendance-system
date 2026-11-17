
from create_app import create_app
from extensions import db
from models import Branch, User, Attendance, FaceTemplate, AttendanceAttempt, VerificationAttempt
from datetime import datetime
import json

app = create_app()

with app.app_context():
    # Get all data
    branches = Branch.query.all()
    users = User.query.all()
    attendances = Attendance.query.all()
    face_templates = FaceTemplate.query.all()
    attendance_attempts = AttendanceAttempt.query.all()
    verification_attempts = VerificationAttempt.query.all()

    # Write to file
    with open('geo_face_attendance_export.json', 'w', encoding='utf-8') as f:
        data = {
            'branches': [
                {
                    'id': b.id,
                    'branch_name': b.branch_name,
                    'branch_code': b.branch_code,
                    'address': b.address,
                    'latitude': b.latitude,
                    'longitude': b.longitude,
                    'allowed_radius_meters': b.allowed_radius_meters,
                    'is_active': b.is_active,
                    'created_at': b.created_at.isoformat() if b.created_at else None,
                    'updated_at': b.updated_at.isoformat() if b.updated_at else None
                } for b in branches
            ],
            'users': [
                {
                    'id': u.id,
                    'full_name': u.full_name,
                    'employee_id': u.employee_id,
                    'email': u.email,
                    'phone': u.phone,
                    'role': u.role.value,
                    'branch_id': u.branch_id,
                    'profile_image_path': u.profile_image_path,
                    'is_active': u.is_active,
                    'created_at': u.created_at.isoformat() if u.created_at else None,
                    'updated_at': u.updated_at.isoformat() if u.updated_at else None
                } for u in users
            ],
            'attendances': [
                {
                    'id': a.id,
                    'employee_id': a.employee_id,
                    'branch_id': a.branch_id,
                    'attendance_date': a.attendance_date.isoformat() if a.attendance_date else None,
                    'check_in_time': a.check_in_time.isoformat() if a.check_in_time else None,
                    'check_out_time': a.check_out_time.isoformat() if a.check_out_time else None,
                    'check_in_latitude': a.check_in_latitude,
                    'check_in_longitude': a.check_in_longitude,
                    'check_out_latitude': a.check_out_latitude,
                    'check_out_longitude': a.check_out_longitude,
                    'check_in_distance_meters': a.check_in_distance_meters,
                    'check_out_distance_meters': a.check_out_distance_meters,
                    'location_verified': a.location_verified,
                    'face_verified': a.face_verified,
                    'status': a.status.value,
                    'created_at': a.created_at.isoformat() if a.created_at else None,
                    'updated_at': a.updated_at.isoformat() if a.updated_at else None
                } for a in attendances
            ],
            'face_templates': [
                {
                    'id': ft.id,
                    'employee_id': ft.employee_id,
                    'embedding': ft.embedding,
                    'model_name': ft.model_name,
                    'created_at': ft.created_at.isoformat() if ft.created_at else None,
                    'updated_at': ft.updated_at.isoformat() if ft.updated_at else None
                } for ft in face_templates
            ],
            'attendance_attempts': [
                {
                    'id': aa.id,
                    'employee_id': aa.employee_id,
                    'attempt_type': aa.attempt_type,
                    'location_verified': aa.location_verified,
                    'face_verified': aa.face_verified,
                    'calculated_distance_meters': aa.calculated_distance_meters,
                    'latitude': aa.latitude,
                    'longitude': aa.longitude,
                    'expires_at': aa.expires_at.isoformat() if aa.expires_at else None,
                    'consumed_at': aa.consumed_at.isoformat() if aa.consumed_at else None,
                    'created_at': aa.created_at.isoformat() if aa.created_at else None
                } for aa in attendance_attempts
            ],
            'verification_attempts': [
                {
                    'id': va.id,
                    'employee_id': va.employee_id,
                    'verification_type': va.verification_type,
                    'success': va.success,
                    'reason': va.reason,
                    'created_at': va.created_at.isoformat() if va.created_at else None
                } for va in verification_attempts
            ]
        }
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Database exported to geo_face_attendance_export.json")

