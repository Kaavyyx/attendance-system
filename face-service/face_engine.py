
from __future__ import annotations

import json
from io import BytesIO
from typing import Optional, Tuple

import numpy as np
from PIL import Image


_face_engine: Optional[object] = None
_model_name = "buffalo_l/w600k_r50"
_provider = "CPUExecutionProvider"


def get_engine():
    global _face_engine
    if _face_engine is None:
        from insightface.app import FaceAnalysis
        _face_engine = FaceAnalysis(name="buffalo_l", providers=[_provider])
        _face_engine.prepare(ctx_id=-1, det_size=(640, 640))
        print("FACE ENGINE READY")
    return _face_engine


def process_image(image_bytes: bytes) -> np.ndarray:
    if not image_bytes or len(image_bytes) == 0:
        raise ValueError("Image is empty")
    try:
        image = Image.open(BytesIO(image_bytes))
        image.verify()
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        return np.array(image)[:, :, ::-1]  # RGB to BGR
    except Exception as e:
        raise ValueError(f"Invalid or corrupt image: {str(e)}")


def extract_embedding(image_bytes: bytes) -> Tuple[list[float], int]:
    img = process_image(image_bytes)
    engine = get_engine()
    faces = engine.get(img)
    if len(faces) == 0:
        raise ValueError("No face detected")
    if len(faces) > 1:
        raise ValueError("Multiple faces detected")
    embedding = faces[0].embedding
    normalized = embedding / np.linalg.norm(embedding)
    return normalized.tolist(), len(normalized)


def compare_embedding(image_bytes: bytes, stored_embedding_list: list[float]) -> Tuple[bool, float, float]:
    threshold = 0.55  # Conservative initial threshold, cosine similarity
    metric = "cosine_similarity"

    fresh_embedding, dim = extract_embedding(image_bytes)

    stored_embedding = np.array(stored_embedding_list, dtype=np.float32)
    if stored_embedding.shape[0] != dim:
        raise ValueError(f"Embedding dimension mismatch: expected {dim}, got {stored_embedding.shape[0]}")

    stored_normalized = stored_embedding / np.linalg.norm(stored_embedding)
    similarity = float(np.dot(fresh_embedding, stored_normalized))

    matched = similarity >= threshold
    return matched, similarity, threshold

