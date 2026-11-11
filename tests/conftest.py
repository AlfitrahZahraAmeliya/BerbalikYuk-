import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402


@pytest.fixture
def app(tmp_path):
    return create_app({
        "TESTING": True,
        "SECRET_KEY": "kunci-uji",
        "SUPABASE_URL": "",
        "SUPABASE_SERVICE_KEY": "",
        "SQLITE_PATH": str(tmp_path / "uji.db"),
    })


@pytest.fixture
def klien(app):
    return app.test_client()


@pytest.fixture
def klien_masuk(klien):
    r = klien.post("/api/daftar", json={
        "nama": "Rani", "kelas": "7A", "username": "rani", "sandi": "rahasia1",
    })
    assert r.status_code == 201
    return klien
