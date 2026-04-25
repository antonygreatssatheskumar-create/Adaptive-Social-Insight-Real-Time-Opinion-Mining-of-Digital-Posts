"""
app.py  –  Adaptive Social Insight: Flask API Server
============================================================
Endpoints:
  POST /api/analyse/text   → analyse typed/pasted text
  POST /api/analyse/image  → extract text from image, then analyse
  GET  /api/health         → health check
============================================================
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

from translator import process_text
from analyzer   import full_analysis
from ocr_handler import extract_text_from_base64, extract_text_from_bytes

app = Flask(__name__)
CORS(app)   # Allow React dev server (localhost:5173 / 3000) to call this API


# ─────────────────────────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Adaptive Social Insight API is running."})


# ─────────────────────────────────────────────────────────────────────────────
# Text analysis endpoint
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/analyse/text", methods=["POST"])
def analyse_text():
    """
    Request body (JSON):
      { "text": "உங்கள் தமிழ் உரை இங்கே" }

    Response (JSON):
      {
        "original_text":    "…",
        "processed_text":   "…",        ← English (translated if needed)
        "language":         { "code": "ta", "name": "Tamil", "is_english": false },
        "was_translated":   true,
        "sentiment":        { "label": "Positive", "confidence": 94.2, "scores": {…} },
        "sarcasm":          { "label": "Not Sarcastic", "confidence": 87.5, "scores": {…} },
        "adjusted_label":   "Positive",
        "sarcasm_warning":  false
      }
    """
    data = request.get_json(silent=True)
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "No text provided."}), 400

    raw_text = data["text"].strip()

    # 1️⃣  Detect language + translate to English
    translation = process_text(raw_text)

    # 2️⃣  Run ML analysis on the English text
    analysis = full_analysis(translation["processed_text"])

    return jsonify({
        "original_text":   translation["original_text"],
        "processed_text":  translation["processed_text"],
        "language":        translation["language"],
        "was_translated":  translation["was_translated"],
        **analysis,          # sentiment, sarcasm, adjusted_label, sarcasm_warning
    })


# ─────────────────────────────────────────────────────────────────────────────
# Image analysis endpoint
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/analyse/image", methods=["POST"])
def analyse_image():
    """
    Accepts either:
      A) multipart/form-data  → file field named "image"
      B) application/json     → { "image": "<base64 string>" }

    Response (JSON):
      {
        "ocr": { "full_text": "…", "lines": […], "regions_count": 3 },
        "original_text":   "…",
        "processed_text":  "…",
        "language":        { … },
        "was_translated":  true/false,
        "sentiment":       { … },
        "sarcasm":         { … },
        "adjusted_label":  "…",
        "sarcasm_warning": false
      }
    """

    # ── A) multipart file upload ──────────────────────────────────────────────
    if request.files.get("image"):
        file = request.files["image"]
        image_bytes = file.read()
        ocr_result = extract_text_from_bytes(image_bytes)

    # ── B) base64 via JSON ────────────────────────────────────────────────────
    elif request.is_json and request.get_json(silent=True, force=True).get("image"):
        b64 = request.get_json()["image"]
        ocr_result = extract_text_from_base64(b64)

    else:
        return jsonify({"error": "No image provided. Send as form-data 'image' field or JSON base64."}), 400

    # ── OCR failed or no text found ───────────────────────────────────────────
    if not ocr_result["success"]:
        return jsonify({
            "error": "OCR failed: " + ocr_result.get("error", "unknown error"),
            "ocr":   ocr_result,
        }), 500

    if not ocr_result["text_found"]:
        return jsonify({
            "message": "No readable text found in the image.",
            "ocr":     ocr_result,
        }), 200

    # ── Translate + analyse extracted text ────────────────────────────────────
    extracted_text = ocr_result["full_text"]
    translation    = process_text(extracted_text)
    analysis       = full_analysis(translation["processed_text"])

    return jsonify({
        "ocr":             ocr_result,
        "original_text":   translation["original_text"],
        "processed_text":  translation["processed_text"],
        "language":        translation["language"],
        "was_translated":  translation["was_translated"],
        **analysis,
    })


# ─────────────────────────────────────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("="*55)
    print("  Adaptive Social Insight — Backend API")
    print("  Running on http://localhost:5000")
    print("="*55)
    app.run(debug=True, port=5000, use_reloader=False)
