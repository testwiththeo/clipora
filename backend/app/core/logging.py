"""Structured logging configuration for Clipora backend."""

import logging
import sys


def setup_logging(debug: bool = False) -> None:
    """Configure structured logging with consistent format."""
    level = logging.DEBUG if debug else logging.INFO

    formatter = logging.Formatter(
        fmt="%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
        datefmt="%H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)

    # Quiet noisy libraries
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # Ensure app loggers are at the right level
    logging.getLogger("app").setLevel(level)
