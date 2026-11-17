from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from extensions import db, migrate
from models import *  # noqa: F401,F403
from routes.admin import bp as admin_bp
from routes.attendance import bp as attendance_bp
from routes.auth import bp as auth_bp
from routes.branches import bp as branches_bp
from routes.face import bp as face_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.config["JWT_SECRET_KEY"] = app.config.get("SECRET_KEY", "dev-secret-change-me")
    CORS(app)

    db.init_app(app)
    migrate.init_app(app, db)
    JWTManager(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(branches_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(face_bp)

    @app.get("/")
    def health_check():
        return {"status": "ok", "service": "geo-face-attendance-backend"}

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
