"""Application factory for the Flask backend."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Tuple

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS


@lru_cache(maxsize=1)
def _frontend_build_dir() -> Tuple[Path, Path]:
    """Resolve the directory that holds the compiled frontend assets."""

    base_dir = Path(__file__).resolve().parents[1]
    configured = os.getenv("FRONTEND_BUILD_DIR")
    if configured:
        candidate = Path(configured).expanduser().resolve()
        if candidate.exists():
            return candidate, candidate / "index.html"

    fallback = base_dir / "public"
    return fallback, fallback / "index.html"


def create_app() -> Flask:
    """Create a Flask app instance with registered routes and static serving."""

    static_dir, _ = _frontend_build_dir()
    static_root = str(static_dir)
    app = Flask(__name__, static_folder=static_root, static_url_path="")
    CORS(app)

    from backend.ai_routes import bp as ai_blueprint

    app.register_blueprint(ai_blueprint)

    @app.route("/healthz", methods=["GET"])
    def healthcheck():  # pragma: no cover - trivial endpoint
        return jsonify({"status": "ok"})

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path: str):
        static_dir, index_html = _frontend_build_dir()
        static_root = str(static_dir)
        target = static_dir / path if path else index_html

        if path and target.exists() and target.is_file():
            return send_from_directory(static_root, path)

        if index_html.exists():
            return send_from_directory(static_root, "index.html")

        return (
            jsonify({"error": "Frontend build not found", "path": str(index_html)}),
            500,
        )

    return app


app = create_app()


if __name__ == "__main__":
    DEBUG_MODE = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=5000, debug=DEBUG_MODE)
