"""Pabrik aplikasi Flask BerbalikYuk!"""
import secrets

from flask import Flask, jsonify, request

from .config import DI_VERCEL, Config
from .db import buat_repo

CSP = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com; "
    "img-src 'self' data:; "
    # Service worker mengambil & menyimpan font Google agar tetap tampil saat offline.
    "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; "
    "manifest-src 'self'; "
    "base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
)


def create_app(test_config=None):
    app = Flask(__name__, static_folder="../static", static_url_path="/static")
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    if not app.config["SECRET_KEY"]:
        if DI_VERCEL:
            raise RuntimeError("SECRET_KEY wajib diisi di variabel lingkungan Vercel.")
        # Lokal tanpa .env: kunci acak sementara (sesi hilang saat server dimulai ulang).
        app.config["SECRET_KEY"] = secrets.token_hex(32)
        app.logger.warning("SECRET_KEY belum diisi; memakai kunci sementara.")

    if DI_VERCEL and not (app.config["SUPABASE_URL"] and app.config["SUPABASE_SERVICE_KEY"]):
        raise RuntimeError("SUPABASE_URL dan SUPABASE_SERVICE_KEY wajib diisi di Vercel.")

    app.json.ensure_ascii = False
    app.extensions["repo"] = buat_repo(app.config, app.instance_path)

    from . import routes_api, routes_halaman

    app.register_blueprint(routes_halaman.bp)
    app.register_blueprint(routes_api.bp)

    @app.after_request
    def header_keamanan(respons):
        respons.headers.setdefault("X-Content-Type-Options", "nosniff")
        respons.headers.setdefault("Referrer-Policy", "same-origin")
        respons.headers.setdefault("Content-Security-Policy", CSP)
        if request.path.startswith("/api/"):
            respons.headers["Cache-Control"] = "no-store"
        return respons

    @app.errorhandler(500)
    def galat_server(_):
        return jsonify({"galat": "Terjadi gangguan di server. Coba lagi sebentar lagi."}), 500

    return app
