# GeoFace Employee Attendance System

GeoFace Employee Attendance System is a full-stack mobile attendance application for employee check-in and check-out using geofencing, face verification, and JWT-based authentication.

## Phase 1 Status

This workspace now contains:
- a React Native + Expo TypeScript mobile app under mobile/
- a Flask backend foundation under backend/
- initial documentation and environment examples under docs/

## Architecture decisions

- Mobile: Expo + React Native + TypeScript
- Backend: Flask + Python
- Database: PostgreSQL + SQLAlchemy
- Auth: JWT + bcrypt
- Location: Expo Location
- Camera: Expo Camera
- Secure storage: Expo SecureStore
- Navigation: React Navigation

## Folder structure

- mobile/ - Expo mobile application
- backend/ - Flask REST API
- docs/ - project documentation

## Next steps

Phase 2 will add:
- PostgreSQL models
- SQLAlchemy setup
- branch, user, attendance, and attendance attempt models
