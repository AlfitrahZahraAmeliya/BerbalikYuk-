"""Pengaturan aplikasi, dibaca dari variabel lingkungan (.env)."""
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

DI_VERCEL = bool(os.environ.get("VERCEL"))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "")
    SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

    # Dipakai hanya jika Supabase tidak diisi (pengembangan lokal).
    SQLITE_PATH = os.environ.get("SQLITE_PATH", "")

    SESSION_COOKIE_NAME = "berbalikyuk_sesi"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = DI_VERCEL or os.environ.get("FLASK_ENV") == "production"
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)

    MAX_CONTENT_LENGTH = 64 * 1024  # request JSON kecil saja

    # ---- Pembimbing AI (Gemini) ----
    # Nama tutor: SATU-SATUNYA tempat nama ini ditentukan (dipakai prompt & UI).
    NAMA_PEMBIMBING = os.environ.get("NAMA_PEMBIMBING", "Kak Balik")
    # Kunci HANYA dari variabel lingkungan. Jangan pernah ditulis di kode.
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
    GEMINI_URL_DASAR = os.environ.get(
        "GEMINI_URL_DASAR", "https://generativelanguage.googleapis.com/v1beta"
    ).rstrip("/")
    AI_BATAS_PER_JAM = int(os.environ.get("AI_BATAS_PER_JAM", "40"))
