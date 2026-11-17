
from flask import Flask, request, jsonify
from config import Config
import face_engine
import json

app = Flask(__name__)
app.config.from_object(Config)


@app.get("/health")
def health():
    engine_initialized = False
    try:
        face_engine.get_engine()
        engine_initialized = True
    except Exception:
        pass
    return jsonify({
        "status": "ok",
        "engine_initialized": engine_initialized,
        "model_name": face_engine._model_name,
        "provider": face_engine._provider
    })


@app.post("/internal/face/embed")
def embed():
    if "image" not in request.files:
        return jsonify({"error": "Image is required"}), 400
    file = request.files["image"]
    try:
        image_bytes = file.read()
        embedding, dimension = face_engine.extract_embedding(image_bytes)
        return jsonify({
            "embedding": embedding,
            "dimension": dimension,
            "model_name": face_engine._model_name
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal error processing image"}), 500


@app.post("/internal/face/compare")
def compare():
    if "image" not in request.files:
        return jsonify({"error": "Image is required"}), 400
    if "stored_embedding" not in request.form:
        return jsonify({"error": "Stored embedding is required"}), 400
    file = request.files["image"]
    stored_embedding_str = request.form["stored_embedding"]
    try:
        stored_embedding = json.loads(stored_embedding_str)
        image_bytes = file.read()
        matched, similarity, threshold = face_engine.compare_embedding(image_bytes, stored_embedding)
        return jsonify({
            "matched": matched,
            "similarity": similarity,
            "threshold": threshold,
            "metric": "cosine_similarity",
            "model_name": face_engine._model_name
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid stored embedding format"}), 400
    except Exception as e:
        return jsonify({"error": "Internal error processing image"}), 500


if __name__ == "__main__":
    app.run(host=app.config["HOST"], port=app.config["PORT"], debug=app.config["DEBUG"])

