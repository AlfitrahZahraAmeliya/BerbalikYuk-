"""Akun siswa: validasi, hash kata sandi, dan penjaga login."""
import re
from functools import wraps

from flask import jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash

from .db import get_repo

POLA_USERNAME = re.compile(r"^[a-z0-9_]{3,20}$")


def galat(pesan, status=400):
    return jsonify({"galat": pesan}), status


def siswa_publik(siswa):
    return {k: siswa[k] for k in ("id", "username", "nama", "kelas")}


def validasi_daftar(data):
    """Kembalikan (data_bersih, pesan_galat)."""
    nama = str(data.get("nama", "")).strip()
    kelas = str(data.get("kelas", "")).strip()
    username = str(data.get("username", "")).strip().lower()
    sandi = str(data.get("sandi", ""))
    if not 1 <= len(nama) <= 40:
        return None, "Nama panggilan wajib diisi (maksimal 40 huruf)."
    if not 1 <= len(kelas) <= 10:
        return None, "Kelas wajib diisi, misalnya 7A."
    if not POLA_USERNAME.match(username):
        return None, "Username 3–20 karakter, hanya huruf kecil, angka, atau garis bawah (_)."
    if not 6 <= len(sandi) <= 72:
        return None, "Kata sandi minimal 6 karakter."
    return {"nama": nama, "kelas": kelas, "username": username, "sandi": sandi}, None


def daftar(data):
    bersih, pesan = validasi_daftar(data)
    if pesan:
        return None, (pesan, 400)
    repo = get_repo()
    if repo.cari_siswa_username(bersih["username"]):
        return None, ("Username sudah dipakai. Coba username lain.", 409)
    siswa = repo.buat_siswa(
        bersih["username"], bersih["nama"], bersih["kelas"], generate_password_hash(bersih["sandi"])
    )
    return siswa, None


def masuk(data):
    username = str(data.get("username", "")).strip().lower()
    sandi = str(data.get("sandi", ""))
    siswa = get_repo().cari_siswa_username(username) if username else None
    if not siswa or not check_password_hash(siswa["password_hash"], sandi):
        return None
    return siswa


def mulai_sesi(siswa):
    session.clear()
    session.permanent = True
    session["siswa_id"] = siswa["id"]


def siswa_id_sekarang():
    return session.get("siswa_id")


def wajib_login(fungsi):
    @wraps(fungsi)
    def pembungkus(*args, **kwargs):
        if not siswa_id_sekarang():
            return galat("Silakan masuk terlebih dahulu.", 401)
        return fungsi(*args, **kwargs)

    return pembungkus
