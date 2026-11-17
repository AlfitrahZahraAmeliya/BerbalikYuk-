"""Endpoint JSON /api/* (kontrak lengkap di CLAUDE.md)."""
from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request, session

from . import auth, bank_soal, checker, pembimbing
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
    # Setelah benar, kirim arah hubungan untuk langkah Validasi (RMT fase Output).
    if hasil["benar"] and soal.get("nilai"):
        berubah, naik, dicari, dicari_naik = checker.arah_hubungan(soal)
        hasil["arah"] = {"berubah": berubah, "naik": naik, "dicari": dicari, "dicari_naik": dicari_naik}
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


# ---------- Pembimbing AI (F12) ----------

@bp.get("/pembimbing/status")
@wajib_login
def status_pembimbing():
    config = current_app.config
    return jsonify({"aktif": bool(config["GEMINI_API_KEY"]), "nama": config["NAMA_PEMBIMBING"]})


@bp.post("/pembimbing")
@wajib_login
def tanya_pembimbing():
    data = _json_wajib()
    if data is None:
        return galat("Format data tidak dikenali.", 415)
    config = current_app.config
    nama = config["NAMA_PEMBIMBING"]
    if not config["GEMINI_API_KEY"]:
        return galat(f"{nama} belum aktif. Pakai Petunjuk dulu, ya.", 503)

    sumber = data.get("sumber")
    mode = data.get("mode", "bimbing")
    fase = data.get("fase") if data.get("fase") in pembimbing.FASE else None
    pesan = str(data.get("pesan", "")).strip()
    if sumber not in pembimbing.SUMBER or mode not in pembimbing.MODE:
        return galat("Permintaan tidak dikenali.")
    if not 1 <= len(pesan) <= pembimbing.PANJANG_MAKS_PESAN:
        return galat(f"Tulis pertanyaanmu (maksimal {pembimbing.PANJANG_MAKS_PESAN} huruf).")
    ref = str(data.get("ref", ""))[:40]
    sumber_data = pembimbing.cari_sumber(sumber, ref)
    if sumber_data is None:
        return galat("Bagian yang ditanyakan tidak ditemukan.", 404)

    siswa_id = siswa_id_sekarang()
    repo = get_repo()
    if sumber == "latihan" and not _tingkat_terbuka(siswa_id, sumber_data["tingkat"]):
        return galat("Tingkat ini belum terbuka.", 403)
    if mode == "refleksi" and not (sumber == "latihan" and repo.pernah_benar(siswa_id, sumber_data["id"])):
        return galat("Refleksi dibuka setelah soal dijawab dengan benar.")

    sejak = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    if repo.hitung_bimbingan_sejak(siswa_id, sejak) >= config["AI_BATAS_PER_JAM"]:
        return galat(f"{nama} sedang istirahat sebentar. Coba lagi nanti atau pakai Petunjuk, ya.", 429)

    keadaan = data.get("keadaan") if isinstance(data.get("keadaan"), dict) else {}
    riwayat = pembimbing.bersihkan_riwayat(data.get("riwayat"))
    jumlah_tanya = sum(1 for g in riwayat if g["peran"] == "siswa")
    cadangan = pembimbing.petunjuk_cadangan(sumber, sumber_data, keadaan, jumlah_tanya)

    sistem = pembimbing.prompt_sistem(nama)
    if mode == "refleksi":
        sistem += pembimbing.TAMBAHAN_REFLEKSI
        terlarang = []  # jawaban sudah diperoleh siswa sendiri
    else:
        terlarang = pembimbing.angka_terlarang(sumber, sumber_data, keadaan)
    sistem += pembimbing.bangun_konteks(sumber, sumber_data, keadaan, fase)

    pakai_cadangan = False
    try:
        mentah = pembimbing.minta_gemini(config, sistem, riwayat, pesan)
        balasan, tersaring = pembimbing.saring_balasan(mentah, terlarang, cadangan)
    except pembimbing.GalatPembimbing as masalah:
        current_app.logger.warning("Pembimbing AI memakai cadangan: %s", masalah)
        balasan, tersaring, pakai_cadangan = cadangan, False, True

    repo.simpan_bimbingan({
        "siswa_id": siswa_id,
        "sumber": sumber,
        "ref_id": ref,
        "fase": fase,
        "mode": mode,
        "pesan_siswa": pesan,
        "balasan": balasan,
        "tersaring": tersaring,
        "cadangan": pakai_cadangan,
    })
    return jsonify({"balasan": balasan, "tersaring": tersaring, "cadangan": pakai_cadangan, "nama": nama})


# ---------- Galat ----------

@bp.errorhandler(404)
def tidak_ada(_):
    return galat("Alamat tidak ditemukan.", 404)


@bp.errorhandler(405)
def metode_salah(_):
    return galat("Metode tidak diizinkan.", 405)
