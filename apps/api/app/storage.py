import uuid
from pathlib import Path

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


def save_upload(content: bytes, suffix: str = ".jpg") -> str:
    """Saves bytes to disk and returns a URL path served by the static mount."""
    name = f"{uuid.uuid4().hex}{suffix}"
    (UPLOADS_DIR / name).write_bytes(content)
    return f"/uploads/{name}"
