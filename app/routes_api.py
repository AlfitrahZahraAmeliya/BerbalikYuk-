"""Endpoint JSON /api/* (kontrak lengkap di CLAUDE.md)."""
from flask import Blueprint, jsonify, request, session

from . import auth, bank_soal, checker
from .auth import galat, siswa_id_sekarang, wajib_login
from .db import get_repo, simpan_progres, tambah_hint

bp = Blueprint("api", __name__, url_prefix="/api")

# Cukup untuk teks opsi terpanjang; mencegah data berlebihan tersimpan.
PANJANG_MAKS_JAWABAN = 200

MODUL_VALID = (
    {"prasyarat", "contoh", "kuis"}
    | {f"materi-{i}" for i in range(1, 7)}
    | {f"latihan-{t}" for t in bank_soal.TINGKAT}
)


def _json_wajib():
    """Endpoint yang mengubah data hanya menerima JSON (bersama SameSite=Lax mencegah CSRF)."""
    if not request.is_json:
        return None
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None


def _angka_bulat(nilai, minimum, maksimum, bawaan=0):
    try:
        n = int(nilai)
    except (TypeError, ValueError):
        return bawaan
    return max(minimum, min(maksimum, n))


def _tingkat_terbuka(siswa_id, tingkat):
    syarat = bank_soal.SYARAT_BUKA.get(tingkat)
    if not syarat:
        return True
    progres = get_repo().ambil_progres(siswa_id, syarat)
    return bool(progres and (progres.get("skor") or 0) >= bank_soal.SKOR_MINIMAL_BUKA)


# ---------- Akun ----------

@bp.post("/daftar")
def daftar():
    data = _json_wajib()
    if data is None:
        return galat("Format data tidak dikenali.", 415)
    siswa, masalah = auth.daftar(data)
    if masalah:
        return galat(*masalah)
    auth.mulai_sesi(siswa)
    return jsonify(auth.siswa_publik(siswa)), 201


@bp.post("/masuk")
def masuk():
    data = _json_wajib()
    if data is None:
        return galat("Format data tidak dikenali.", 415)
    siswa = auth.masuk(data)
    if not siswa:
        return galat("Username atau kata sandi salah.", 401)
    auth.mulai_sesi(siswa)
    return jsonify(auth.siswa_publik(siswa))


@bp.post("/keluar")
def keluar():
    session.clear()
    return "", 204


@bp.get("/saya")
@wajib_login
def saya():
    siswa = get_repo().ambil_siswa(siswa_id_sekarang())
    if not siswa:
        session.clear()
        return galat("Akun tidak ditemukan. Silakan masuk lagi.", 401)
    return jsonify(auth.siswa_publik(siswa))


# ---------- Progres ----------

@bp.get("/progres")
@wajib_login
def ambil_progres():
    siswa_id = siswa_id_sekarang()
    repo = get_repo()
    return jsonify({"modul": repo.daftar_progres(siswa_id), "kuis_terakhir": repo.kuis_terakhir(siswa_id)})


@bp.post("/progres")
@wajib_login
def simpan():
    data = _json_wajib()
    if data is None:
        return galat("Format data tidak dikenali.", 415)
    modul_id = data.get("modul_id")
    if modul_id not in MODUL_VALID or modul_id == "kuis":
        return galat("Modul tidak dikenal.")
    skor = data.get("skor")
    skor = None if skor is None else _angka_bulat(skor, 0, 100)
    simpan_progres(siswa_id_sekarang(), modul_id, bool(data.get("selesai")), skor)
    return jsonify({"ok": True})


# ---------- Latihan ----------

@bp.get("/latihan/<tingkat>")
@wajib_login
def latihan(tingkat):
    if tingkat not in bank_soal.TINGKAT:
        return galat("Tingkat latihan tidak dikenal.", 404)
    if not _tingkat_terbuka(siswa_id_sekarang(), tingkat):
        return galat("Selesaikan tingkat sebelumnya dengan skor minimal 60 dulu, ya.", 403)
    soal = [bank_soal.soal_publik(s) for s in bank_soal.latihan_per_tingkat(tingkat)]
    return jsonify({"tingkat": tingkat, "soal": soal})


@bp.get("/hint/<soal_id>/<int:n>")
@wajib_login
def hint(soal_id, n):
    soal = bank_soal.cari_latihan(soal_id)
    if not soal:
        return galat("Soal tidak ditemukan.", 404)
    daftar_hint = soal.get("hint", [])
    if not 1 <= n <= len(daftar_hint):
        return galat("Petunjuk tidak tersedia.", 404)
    siswa_id = siswa_id_sekarang()
    if not _tingkat_terbuka(siswa_id, soal["tingkat"]):
        return galat("Tingkat ini belum terbuka.", 403)
    tambah_hint(siswa_id, f"latihan-{soal['tingkat']}")
    return jsonify({"hint": daftar_hint[n - 1], "n": n, "total": len(daftar_hint)})


@bp.post("/periksa")
@wajib_login
def periksa():
    data = _json_wajib()
    if data is None:
        return galat("Format data tidak dikenali.", 415)
    soal = bank_soal.cari_latihan(data.get("soal_id"))
    if not soal:
        return galat("Soal tidak ditemukan.", 404)
    siswa_id = siswa_id_sekarang()
    if not _tingkat_terbuka(siswa_id, soal["tingkat"]):
        return galat("Tingkat ini belum terbuka.", 403)

    jawaban = data.get("jawaban")
    if isinstance(jawaban, str):
        jawaban = jawaban[:PANJANG_MAKS_JAWABAN]
    isian_tabel = data.get("isian_tabel") if isinstance(data.get("isian_tabel"), dict) else None
    hubungan = data.get("hubungan") if data.get("hubungan") in ("senilai", "berbalik") else None

    hasil = checker.periksa_jawaban(soal, jawaban, isian_tabel, hubungan)
    get_repo().simpan_attempt({
        "siswa_id": siswa_id,
        "modul_id": f"latihan-{soal['tingkat']}",
        "soal_id": soal["id"],
        "jawaban": None if jawaban is None else str(jawaban),
        "benar": hasil["benar"],
        "jenis_kesalahan": hasil["jenis_kesalahan"],
        "hint_level": _angka_bulat(data.get("hint_level"), 0, 3),
        "durasi_detik": _angka_bulat(data.get("durasi_detik"), 0, 3600),
    })
    # Pembahasan diberikan setelah benar, atau setelah 2 kali mencoba.
    if hasil["benar"] or _angka_bulat(data.get("percobaan"), 1, 99, 1) >= 2:
        hasil["pembahasan"] = soal.get("pembahasan", "")
    return jsonify(hasil)


# ---------- Kuis ----------

@bp.get("/kuis")
@wajib_login
def kuis():
    return jsonify({"soal": [bank_soal.soal_publik(s) for s in bank_soal.semua_kuis()]})


@bp.post("/kuis/kirim")
@wajib_login
def kirim_kuis():
    data = _json_wajib()
    if data is None or not isinstance(data.get("jawaban"), dict):
        return galat("Format jawaban tidak dikenali.", 415)
    jawaban = {str(k): (v[:PANJANG_MAKS_JAWABAN] if isinstance(v, str) else v) for k, v in data["jawaban"].items()}
    skor, skor_per_tp, rincian = checker.nilai_kuis(bank_soal.semua_kuis(), jawaban)
    siswa_id = siswa_id_sekarang()
    get_repo().simpan_kuis(siswa_id, skor, skor_per_tp)
    simpan_progres(siswa_id, "kuis", True, skor)
    return jsonify({"skor": skor, "skor_per_tp": skor_per_tp, "pembahasan": rincian})


# ---------- Galat ----------

@bp.errorhandler(404)
def tidak_ada(_):
    return galat("Alamat tidak ditemukan.", 404)


@bp.errorhandler(405)
def metode_salah(_):
    return galat("Metode tidak diizinkan.", 405)
