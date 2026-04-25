"""
analyzer.py
Core ML engine for:
  1. Sentiment Analysis (Positive / Negative / Neutral)
  2. Sarcasm / Irony Detection
Uses HuggingFace Transformers — models are downloaded once and cached locally.
No API key required.
"""

from transformers import pipeline
import re

# ── Model IDs (downloaded automatically on first run) ─────────────────────────
SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
SARCASM_MODEL   = "cardiffnlp/twitter-roberta-base-irony"

# ── Lazy-loaded pipelines (initialised once, reused on every request) ─────────
_sentiment_pipeline = None
_sarcasm_pipeline   = None


def _get_sentiment_pipeline():
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        print("[INFO] Loading sentiment model (first run – please wait)…")
        _sentiment_pipeline = pipeline(
            "text-classification",
            model=SENTIMENT_MODEL,
            top_k=None        # replaces deprecated return_all_scores=True
        )
    return _sentiment_pipeline


def _get_sarcasm_pipeline():
    global _sarcasm_pipeline
    if _sarcasm_pipeline is None:
        print("[INFO] Loading sarcasm model (first run – please wait)…")
        _sarcasm_pipeline = pipeline(
            "text-classification",
            model=SARCASM_MODEL,
            top_k=None        # replaces deprecated return_all_scores=True
        )
    return _sarcasm_pipeline


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clean_text(text: str) -> str:
    """Basic cleaning: remove URLs, extra spaces."""
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _truncate(text: str, max_tokens: int = 512) -> str:
    """RoBERTa has a 512-token limit; truncate by words as a safe approximation."""
    words = text.split()
    return " ".join(words[:max_tokens])


# ── Label mappings ────────────────────────────────────────────────────────────

# cardiffnlp sentiment model returns: LABEL_0 = Negative, LABEL_1 = Neutral, LABEL_2 = Positive
SENTIMENT_MAP = {
    "LABEL_0": "Negative",
    "LABEL_1": "Neutral",
    "LABEL_2": "Positive",
    # The latest model version sometimes returns these directly:
    "negative": "Negative",
    "neutral":  "Neutral",
    "positive": "Positive",
}

# cardiffnlp irony model returns: LABEL_0 = Non-irony, LABEL_1 = Irony
IRONY_MAP = {
    "LABEL_0": "Not Sarcastic",
    "LABEL_1": "Sarcastic",
    "non_irony": "Not Sarcastic",
    "irony":     "Sarcastic",
}

SENTIMENT_EMOJI = {
    "Positive": "😊",
    "Negative": "😠",
    "Neutral":  "😐",
}

SARCASM_EMOJI = {
    "Sarcastic":     "🙄",
    "Not Sarcastic": "✅",
}


# ── Core analysis functions ───────────────────────────────────────────────────

def analyse_sentiment(text: str) -> dict:
    """
    Run sentiment classification.
    Returns predicted label, confidence scores for all three classes,
    and an overall confidence percentage.
    """
    text = _truncate(_clean_text(text))
    pipe  = _get_sentiment_pipeline()

    try:
        raw = pipe(text)[0]   # list of {label, score}

        # Build a clean scores dict
        scores = {}
        for item in raw:
            mapped = SENTIMENT_MAP.get(item["label"], item["label"])
            scores[mapped] = round(item["score"] * 100, 2)

        # Predicted label = highest score
        predicted = max(scores, key=scores.get)

        return {
            "label":      predicted,
            "emoji":      SENTIMENT_EMOJI.get(predicted, ""),
            "confidence": scores.get(predicted, 0),
            "scores": {
                "Positive": scores.get("Positive", 0),
                "Neutral":  scores.get("Neutral",  0),
                "Negative": scores.get("Negative", 0),
            }
        }
    except Exception as e:
        return {
            "label": "Error",
            "emoji": "❓",
            "confidence": 0,
            "scores": {"Positive": 0, "Neutral": 0, "Negative": 0},
            "error": str(e)
        }


def analyse_sarcasm(text: str) -> dict:
    """
    Detect whether the text is sarcastic / ironic.
    Returns label + confidence score.
    """
    text = _truncate(_clean_text(text))
    pipe  = _get_sarcasm_pipeline()

    try:
        raw = pipe(text)[0]

        scores = {}
        for item in raw:
            mapped = IRONY_MAP.get(item["label"], item["label"])
            scores[mapped] = round(item["score"] * 100, 2)

        predicted = max(scores, key=scores.get)

        return {
            "label":      predicted,
            "emoji":      SARCASM_EMOJI.get(predicted, ""),
            "confidence": scores.get(predicted, 0),
            "scores": {
                "Sarcastic":     scores.get("Sarcastic",     0),
                "Not Sarcastic": scores.get("Not Sarcastic", 0),
            }
        }
    except Exception as e:
        return {
            "label": "Error",
            "emoji": "❓",
            "confidence": 0,
            "scores": {"Sarcastic": 0, "Not Sarcastic": 0},
            "error": str(e)
        }


def full_analysis(text: str) -> dict:
    """
    Run both sentiment and sarcasm analysis on the (already-translated) text.
    Returns a combined result dict.

    Sarcasm correction logic:
    - If sarcasm confidence > 55% AND sentiment is Positive → flip to Negative (Sarcastic)
    - Threshold lowered from 65 → 55 to catch borderline sarcasm cases
    """
    sentiment = analyse_sentiment(text)
    sarcasm   = analyse_sarcasm(text)

    adjusted_label  = sentiment["label"]
    sarcasm_warning = False

    if (
        sarcasm["label"] == "Sarcastic"
        and sarcasm["confidence"] > 55          # ← FIXED: was 65, now 55
        and sentiment["label"] == "Positive"
    ):
        adjusted_label  = "Negative (Sarcastic)"
        sarcasm_warning = True

    return {
        "sentiment":       sentiment,
        "sarcasm":         sarcasm,
        "adjusted_label":  adjusted_label,
        "sarcasm_warning": sarcasm_warning,
    }
