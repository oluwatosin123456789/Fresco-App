import os
import tempfile

import pytest

_tmp_dir = tempfile.mkdtemp(prefix="fresco_test_")
os.environ["FRESCO_DB_PATH"] = os.path.join(_tmp_dir, "test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def auth_headers():
    return {"X-Device-Id": "test-device-1"}


@pytest.fixture()
def tiny_jpeg_bytes() -> bytes:
    # grade_image only hashes raw bytes (see app/grading.py) -- it never
    # decodes the image -- so arbitrary bytes are a sufficient stand-in for
    # a real photo upload in tests.
    return b"\xff\xd8\xff\xe0 fake-jpeg-bytes-for-tests \xff\xd9"
