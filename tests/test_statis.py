"""Regresi: versi aplikasi lama tertahan di HP pengguna lama.

Penyebab di server: ETag bawaan = "mtime-ukuran-path". Di Vercel mtime semua file dibekukan,
sehingga file yang isinya berubah tetapi ukurannya sama dibalas 304 (dianggap tidak berubah).
"""
import hashlib
import os

from app.statis import etag_isi

FOLDER_STATIS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")


def test_etag_berbeda_untuk_isi_berbeda_walau_mtime_dan_ukuran_sama(tmp_path):
    a, b = tmp_path / "a.js", tmp_path / "b.js"
    a.write_text("const versi = 1;")
    b.write_text("const versi = 2;")          # ukuran sama persis
    for f in (a, b):
        os.utime(f, (1540000000, 1540000000))  # mtime dibekukan seperti di Vercel
    assert a.stat().st_size == b.stat().st_size
    assert etag_isi(str(a), 1540000000, a.stat().st_size) != etag_isi(str(b), 1540000000, b.stat().st_size)


def _etag_diharapkan(relatif):
    with open(os.path.join(FOLDER_STATIS, relatif), "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()[:32]


def test_file_statis_memakai_etag_isi_dan_304_hanya_jika_cocok(klien):
    r = klien.get("/static/js/halaman/beranda.js")
    assert r.status_code == 200
    etag = r.headers["ETag"].strip('"')
    assert etag == _etag_diharapkan("js/halaman/beranda.js")
    # ETag cocok → 304
    assert klien.get("/static/js/halaman/beranda.js", headers={"If-None-Match": f'"{etag}"'}).status_code == 304
    # ETag lama berbasis mtime (seperti yang tersimpan di HP pengguna lama) → 200 dengan isi baru
    lama = '"1540000000.0-4166-1807355937"'
    r2 = klien.get("/static/js/halaman/beranda.js",
                   headers={"If-None-Match": lama, "If-Modified-Since": "Wed, 01 Jan 2025 00:00:00 GMT"})
    assert r2.status_code == 200 and b"kartuKakBalik" in r2.data


def test_service_worker_dan_halaman_akar_memakai_etag_isi(klien):
    sw = klien.get("/sw.js")
    assert sw.headers["ETag"].strip('"') == _etag_diharapkan("sw.js")
    assert sw.headers["Cache-Control"] == "no-cache"
    assert klien.get("/").headers["ETag"].strip('"') == _etag_diharapkan("index.html")


def test_jalur_berbahaya_tetap_ditolak(klien):
    assert klien.get("/static/../data/soal.json").status_code == 404
    assert klien.get("/static/tidak-ada.js").status_code == 404
