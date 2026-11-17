from app import create_app
from extensions import db
from models import Branch, User, UserRole
from werkzeug.security import generate_password_hash


def seed_demo_data():
    app = create_app()

    with app.app_context():
        tcs_branches = [
            {
                "branch_name": "STP, TCS Noida-III Office",
                "branch_code": "TCS-NOIDA-III",
                "address": "B-154, Block B, Sector 63, Noida, Uttar Pradesh 201301",
                "latitude": 28.626641,
                "longitude": 77.384803,
                "allowed_radius_meters": 50,
                "is_active": True,
            },
            {
                "branch_name": "SEZ, TCS Noida V Office",
                "branch_code": "TCS-NOIDA-V",
                "address": "Building B2, Seaview Developers SEZ, Plot No. 20 & 21, Sector 135, Noida, Uttar Pradesh 201304",
                "latitude": 28.463236,
                "longitude": 77.456269,
                "allowed_radius_meters": 50,
                "is_active": True,
            },
            {
                "branch_name": "STP, TCS Noida-II Office",
                "branch_code": "TCS-NOIDA-II",
                "address": "C-56, Phase II, Noida, Uttar Pradesh 201305",
                "latitude": 28.535500,
                "longitude": 77.391000,
                "allowed_radius_meters": 50,
                "is_active": True,
            },
            {
                "branch_name": "NON-STP, TCS Noida-IV (Government ISU Centre) Office",
                "branch_code": "TCS-NOIDA-IV-GOV-ISU",
                "address": "Plot No. 61A, Block A, Sector 63, Phase III, Noida, Uttar Pradesh 201301",
                "latitude": 28.626000,
                "longitude": 77.381000,
                "allowed_radius_meters": 50,
                "is_active": True,
            },
            {
                "branch_name": "TCS Home",
                "branch_code": "TCS-HOME-01",
                "address": "Local Test Office - Home Location",
                "latitude": 26.7946563,
                "longitude": 80.9075435,
                "allowed_radius_meters": 50,
                "is_active": True,
            }
        ]

        # Add TCS branches if they do not already exist.
        for data in tcs_branches:
            existing = Branch.query.filter_by(
                branch_code=data["branch_code"]
            ).first()

            if not existing:
                branch = Branch(**data)
                db.session.add(branch)

        db.session.commit()

        # Use first TCS branch as admin's default branch.
        admin_branch = Branch.query.filter_by(
            branch_code="TCS-NOIDA-III"
        ).first()

        admin = User.query.filter_by(
            email="admin@geoface.demo"
        ).first()

        if not admin:
            admin = User(
                full_name="Demo Admin",
                employee_id="ADMIN-001",
                email="admin@geoface.demo",
                phone="9999999999",
                password_hash=generate_password_hash("ChangeMe123!"),
                role=UserRole.ADMIN,
                branch_id=admin_branch.id if admin_branch else None,
                is_active=True,
            )

            db.session.add(admin)

        else:
            # Update existing admin from old Lucknow branch
            # to the new TCS branch.
            admin.branch_id = admin_branch.id if admin_branch else None

        db.session.commit()

        print("TCS branch data seeded successfully.")


if __name__ == "__main__":
    seed_demo_data()