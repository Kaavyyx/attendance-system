from flask import Blueprint, jsonify

from models import Branch

bp = Blueprint("branches", __name__, url_prefix="/api/branches")


@bp.route("/", methods=["GET"])
@bp.route("", methods=["GET"])
def list_branches():
    branches = Branch.query.filter_by(is_active=True).order_by(Branch.branch_name.asc()).all()
    payload = {
        "branches": [
            {
                "id": branch.id,
                "branch_name": branch.branch_name,
                "branch_code": branch.branch_code,
            }
            for branch in branches
        ]
    }
    return jsonify(payload), 200
