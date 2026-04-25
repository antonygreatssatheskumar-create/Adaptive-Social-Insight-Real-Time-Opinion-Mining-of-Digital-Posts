"""
ocr_handler.py
Extracts text from uploaded images using EasyOCR.
Supports Tamil ('ta') and English ('en') with automatic fallback.
No API key required — runs fully offline after first model download.
"""

import easyocr
import numpy as np
from PIL import Image
import io
import base64

# ── Lazy-loaded OCR reader ────────────────────────────────────────────────────
_reader = None


def _get_reader():
    """
    Initialise EasyOCR once; reuse on subsequent calls.
    Tries Tamil + English first; falls back to English-only if model mismatch.
    """
    global _reader
    if _reader is None:
        # First try: Tamil + English
        try:
            print("[INFO] Loading EasyOCR with Tamil + English support…")
            _reader = easyocr.Reader(["ta", "en"], gpu=False)
            print("[INFO] EasyOCR loaded successfully (Tamil + English).")
        except Exception as e:
            print(f"[WARN] Tamil model failed ({e}). Falling back to English only…")
            try:
                _reader = easyocr.Reader(["en"], gpu=False)
                print("[INFO] EasyOCR loaded successfully (English only).")
            except Exception as e2:
                print(f"[ERROR] EasyOCR failed to load: {e2}")
                raise e2
    return _reader


def _reset_reader():
    """Force re-initialisation of the OCR reader (useful after cache clear)."""
    global _reader
    _reader = None


def extract_text_from_bytes(image_bytes: bytes) -> dict:
    """
    Extract text from raw image bytes.
    Returns extracted text and per-region confidence scores.
    """
    try:
        reader = _get_reader()

        # Convert bytes → numpy array for EasyOCR
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(image)

        results = reader.readtext(img_array)

        # results = list of (bounding_box, text, confidence)
        extracted_lines = []
        full_text_parts = []

        for (bbox, text, confidence) in results:
            if confidence > 0.1:          # filter very low-confidence noise
                extracted_lines.append({
                    "text":       text,
                    "confidence": round(confidence * 100, 1),
                })
                full_text_parts.append(text)

        full_text = " ".join(full_text_parts).strip()

        return {
            "success":       True,
            "full_text":     full_text,
            "lines":         extracted_lines,
            "text_found":    bool(full_text),
            "regions_count": len(extracted_lines),
        }

    except Exception as e:
        error_msg = str(e)

        # If it's a model size mismatch, reset and retry with English only
        if "size mismatch" in error_msg or "state_dict" in error_msg:
            print("[WARN] Model size mismatch detected. Resetting to English-only OCR…")
            _reset_reader()
            global _reader
            try:
                _reader = easyocr.Reader(["en"], gpu=False)
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                img_array = np.array(image)
                results = _reader.readtext(img_array)

                extracted_lines = []
                full_text_parts = []
                for (bbox, text, confidence) in results:
                    if confidence > 0.1:
                        extracted_lines.append({
                            "text": text,
                            "confidence": round(confidence * 100, 1),
                        })
                        full_text_parts.append(text)

                full_text = " ".join(full_text_parts).strip()
                return {
                    "success":       True,
                    "full_text":     full_text,
                    "lines":         extracted_lines,
                    "text_found":    bool(full_text),
                    "regions_count": len(extracted_lines),
                    "note":          "Tamil model unavailable — used English OCR only.",
                }
            except Exception as e3:
                return {
                    "success":    False,
                    "full_text":  "",
                    "lines":      [],
                    "text_found": False,
                    "error":      f"OCR retry also failed: {str(e3)}",
                }

        return {
            "success":    False,
            "full_text":  "",
            "lines":      [],
            "text_found": False,
            "error":      error_msg,
        }


def extract_text_from_base64(b64_string: str) -> dict:
    """
    Convenience wrapper: accepts a base64-encoded image string
    (as sent from the React frontend via JSON).
    Strips the data-URI prefix if present (e.g. 'data:image/png;base64,…').
    """
    try:
        if "," in b64_string:
            b64_string = b64_string.split(",", 1)[1]
        image_bytes = base64.b64decode(b64_string)
        return extract_text_from_bytes(image_bytes)
    except Exception as e:
        return {
            "success":    False,
            "full_text":  "",
            "lines":      [],
            "text_found": False,
            "error":      f"Base64 decode error: {str(e)}",
        }
