"""Backend package exposing the Flask application factory."""

from .main import create_app

__all__ = ["create_app"]
