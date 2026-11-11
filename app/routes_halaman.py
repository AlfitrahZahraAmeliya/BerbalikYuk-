"""Menyajikan halaman SPA serta file PWA dari root agar scope service worker = '/'."""
from flask import Blueprint, current_app, send_from_directory

bp = Blueprint("halaman", __name__)


def _kirim(nama, mimetype=None):
    respons = send_from_directory(current_app.static_folder, nama, mimetype=mimetype, max_age=0)
    respons.headers["Cache-Control"] = "no-cache"
    return respons


@bp.get("/")
def beranda():
    return _kirim("index.html")


@bp.get("/sw.js")
def service_worker():
    return _kirim("sw.js", "application/javascript")


@bp.get("/manifest.webmanifest")
def manifest():
    return _kirim("manifest.webmanifest", "application/manifest+json")


@bp.get("/favicon.ico")
def favicon():
    return send_from_directory(current_app.static_folder, "icons/icon-192.png", mimetype="image/png")
