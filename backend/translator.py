"""
translator.py
Handles automatic language detection and translation to English.
Supports Tamil, Hindi, French, Spanish, Arabic, and 100+ other languages.
Uses deep-translator (free, no API key required).
"""

from langdetect import detect, DetectorFactory
from deep_translator import GoogleTranslator

# Make language detection deterministic
DetectorFactory.seed = 0

# Human-readable language names
LANGUAGE_NAMES = {
    "ta": "Tamil",
    "hi": "Hindi",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "ar": "Arabic",
    "zh-cn": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "pt": "Portuguese",
    "ru": "Russian",
    "it": "Italian",
    "ml": "Malayalam",
    "te": "Telugu",
    "kn": "Kannada",
    "bn": "Bengali",
    "ur": "Urdu",
    "en": "English",
}


def detect_language(text: str) -> dict:
    """
    Detect the language of the given text.
    Returns a dict with language code and human-readable name.
    """
    try:
        lang_code = detect(text)
        lang_name = LANGUAGE_NAMES.get(lang_code, lang_code.upper())
        return {
            "code": lang_code,
            "name": lang_name,
            "is_english": lang_code == "en"
        }
    except Exception as e:
        return {
            "code": "unknown",
            "name": "Unknown",
            "is_english": False,
            "error": str(e)
        }


def translate_to_english(text: str, source_lang: str = "auto") -> dict:
    """
    Translate text to English using Google Translator (free, no API key).
    Returns both the translated text and metadata.
    """
    try:
        translator = GoogleTranslator(source=source_lang, target="en")
        translated = translator.translate(text)
        return {
            "success": True,
            "translated_text": translated,
            "original_text": text
        }
    except Exception as e:
        return {
            "success": False,
            "translated_text": text,  # fallback to original
            "original_text": text,
            "error": str(e)
        }


def process_text(text: str) -> dict:
    """
    Full pipeline: detect language → translate if needed → return result.
    This is the main function called by the Flask API.
    """
    if not text or not text.strip():
        return {
            "original_text": text,
            "processed_text": text,
            "language": {"code": "en", "name": "English", "is_english": True},
            "was_translated": False
        }

    # Step 1: Detect language
    lang_info = detect_language(text)

    # Step 2: Translate if not English
    if not lang_info["is_english"] and lang_info["code"] != "unknown":
        translation_result = translate_to_english(text)
        processed_text = translation_result["translated_text"]
        was_translated = translation_result["success"]
    else:
        processed_text = text
        was_translated = False

    return {
        "original_text": text,
        "processed_text": processed_text,
        "language": lang_info,
        "was_translated": was_translated
    }
