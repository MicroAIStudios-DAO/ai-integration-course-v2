"""Blueprint exposing the AI tutor endpoints for the Flask backend."""

from __future__ import annotations

import os
from typing import Any, Dict, Tuple

import openai
from flask import Blueprint, jsonify, request, current_app

bp = Blueprint("ai", __name__)


def _ensure_api_key() -> Tuple[bool, Dict[str, Any]]:
    """Validate that an OpenAI API key is configured before making requests."""

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        current_app.logger.warning("OPENAI_API_KEY is not configured")
        return False, {"error": "OpenAI API key not configured"}

    if openai.api_key != api_key:
        openai.api_key = api_key

    return True, {}


def _call_openai(messages: Any, max_tokens: int) -> Tuple[int, Dict[str, Any]]:
    """Proxy a chat completion to OpenAI with defensive error handling."""

    ok, payload = _ensure_api_key()
    if not ok:
        return 503, payload

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=max_tokens,
        )
    except openai.error.OpenAIError as exc:  # type: ignore[attr-defined]
        current_app.logger.exception("OpenAI error: %s", exc)
        return 502, {"error": "Upstream OpenAI error", "details": str(exc)}
    except Exception as exc:  # pragma: no cover - safeguard against unexpected libs
        current_app.logger.exception("Unexpected error calling OpenAI: %s", exc)
        return 500, {"error": "Internal server error"}

    message = response.choices[0].message.content if response.choices else ""
    return 200, {"content": message.strip()}


@bp.route("/api/tutor", methods=["POST"])
def tutor_chat():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    status, payload = _call_openai(
        [
            {"role": "system", "content": "You are Moe, a compassionate AI tutor."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=500,
    )

    if status != 200:
        return jsonify(payload), status

    return jsonify({"response": payload.get("content", "")})


@bp.route("/api/recap", methods=["POST"])
def personalized_recap():
    data = request.get_json(silent=True) or {}
    user_text = (data.get("text") or "").strip()
    if not user_text:
        return jsonify({"error": "No input text"}), 400

    system_msg = (
        "Using the user’s progress data, generate a concise, step-by-step recap "
        "to reinforce learning and suggest next actions."
    )

    status, payload = _call_openai(
        [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_text},
        ],
        max_tokens=300,
    )

    if status != 200:
        return jsonify(payload), status

    return jsonify({"recap": payload.get("content", "")})
