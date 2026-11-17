
from __future__ import annotations

import json
from io import BytesIO
from typing import Optional, Tuple


# Dependency check
_dependencies_available: Optional[bool] = None
_face_app: Optional[object] = None


def check_face_dependencies() -> bool:
    """Check if optional face recognition dependencies are available."""
    global _dependencies_available
    if _dependencies_available is not None:
        return _dependencies_available
    try:
        import PIL.Image
        import numpy
        import insightface.app
        import onnxruntime
        _dependencies_available = True
    except ImportError:
        _dependencies_available = False
    return _dependencies_available


def get_face_app():
    """Get or initialize the face analysis application."""
    if not check_face_dependencies():
        raise RuntimeError("Face recognition service unavailable (missing dependencies)")

    from insightface.app import FaceAnalysis
    global _face_app
    if _face_app is None:
        # Use lightweight model: buffalo_l (SCRFD detector + ArcFace embedding)
        _face_app = FaceAnalysis(
            name="buffalo_l", providers=["CPUExecutionProvider"])
        # Only need detection and recognition
        _face_app.prepare(ctx_id=0, det_size=(640, 640))
    return _face_app


def process_validate_image(image_bytes: bytes) -> Tuple[Optional[object]]:
    """Validate and decode the uploaded image. Returns PIL Image. Raises ValueError on failure."""
    if not check_face_dependencies():
        raise RuntimeError("Face recognition service unavailable (missing dependencies)")

    from PIL import Image
    try:
        image = Image.open(BytesIO(image_bytes))
        image.verify()
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        return image
    except Exception as e:
        raise ValueError(f"Invalid or corrupt image: {str(e)}")


def get_face_embedding(image):
    """Detect exactly one face in the image and return its embedding. Raises ValueError if 0 or >1 faces detected."""
    if not check_face_dependencies():
        raise RuntimeError("Face recognition service unavailable (missing dependencies)")

    import numpy as np
    app = get_face_app()
    # Convert PIL image to numpy array (RGB -> BGR for insightface
    img_np = np.array(image)[:, :, ::-1]
    faces = app.get(img_np)

    if len(faces) == 0:
        raise ValueError("No face detected in the image. Please try again with a clear face photo.")
    if len(faces) > 1:
        raise ValueError("Multiple faces detected. Please ensure only one face is in the photo.")

    # Return normalized embedding
    return faces[0].embedding


def serialize_embedding(embedding) -> str:
    """Serialize numpy embedding to JSON string for storage."""
    if not check_face_dependencies():
        raise RuntimeError("Face recognition service unavailable (missing dependencies)")

    import numpy as np
    if not all(np.isfinite(embedding).all()):
        raise ValueError("Embedding contains invalid values (NaN/inf).")
    return json.dumps(embedding.tolist())


def get_model_name() -> str:
    """Return the name of the face embedding model used."""
    return "buffalo_l-arcface"
