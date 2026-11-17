
import io
import json
from typing import Optional, Tuple

import requests
from flask import current_app


class FaceServiceError(Exception):
    pass


def check_service_available() -> bool:
    try:
        url = f"{current_app.config['FACE_SERVICE_URL']}/health"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        return data.get("engine_initialized", False)
    except Exception:
        return False


def extract_embedding(image_bytes: bytes) -> Tuple[list[float], str]:
    try:
        url = f"{current_app.config['FACE_SERVICE_URL']}/internal/face/embed"
        files = {"image": ("image.jpg", io.BytesIO(image_bytes), "image/jpeg")}
        response = requests.post(url, files=files, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data["embedding"], data["model_name"]
    except requests.exceptions.RequestException as e:
        raise FaceServiceError(f"Face service request failed: {str(e)}")
    except KeyError:
        raise FaceServiceError("Invalid response from face service")


def compare_embedding(image_bytes: bytes, stored_embedding: list[float]) -> Tuple[bool, float, float]:
    try:
        url = f"{current_app.config['FACE_SERVICE_URL']}/internal/face/compare"
        files = {"image": ("image.jpg", io.BytesIO(image_bytes), "image/jpeg")}
        data = {"stored_embedding": json.dumps(stored_embedding)}
        response = requests.post(url, files=files, data=data, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result["matched"], result["similarity"], result["threshold"]
    except requests.exceptions.RequestException as e:
        raise FaceServiceError(f"Face service request failed: {str(e)}")
    except KeyError:
        raise FaceServiceError("Invalid response from face service")

