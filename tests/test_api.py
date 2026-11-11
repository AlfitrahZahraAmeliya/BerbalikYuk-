"""Uji endpoint API memakai database SQLite sementara."""


def test_daftar_dan_saya(klien_masuk):
    r = klien_masuk.get("/api/saya")
    assert r.status_code == 200
    assert r.get_json()["nama"] == "Rani"
    assert "password_hash" not in r.get_json()


def test_username_ganda_ditolak(klien_masuk):
    r = klien_masuk.post("/api/daftar", json={
        "nama": "Rani 2", "kelas": "7B", "username": "RANI", "sandi": "rahasia2",
    })
    assert r.status_code == 409


def test_validasi_daftar(klien):
    r = klien.post("/api/daftar", json={"nama": "A", "kelas": "7A", "username": "a b", "sandi": "123"})
    assert r.status_code == 400 and "galat" in r.get_json()


def test_harus_json(klien):
    r = klien.post("/api/masuk", data="username=rani&sandi=x")
    assert r.status_code == 415


def test_keluar_lalu_masuk(klien_masuk):
    assert klien_masuk.post("/api/keluar").status_code == 204
    assert klien_masuk.get("/api/saya").status_code == 401
    salah = klien_masuk.post("/api/masuk", json={"username": "rani", "sandi": "salah123"})
    assert salah.status_code == 401
    assert salah.get_json()["galat"] == "Username atau kata sandi salah."
    benar = klien_masuk.post("/api/masuk", json={"username": "rani", "sandi": "rahasia1"})
    assert benar.status_code == 200


def test_tanpa_login_ditolak(klien):
    for path in ("/api/saya", "/api/progres", "/api/latihan/mudah", "/api/kuis"):
        assert klien.get(path).status_code == 401


def test_latihan_tidak_membocorkan_kunci(klien_masuk):
    r = klien_masuk.get("/api/latihan/mudah")
    assert r.status_code == 200
    teks = r.get_data(as_text=True)
    for rahasia in ('"kunci"', '"nilai"', '"pembahasan"', '"hint"', '"jenis"', "salah_jenis"):
        assert rahasia not in teks
    soal = r.get_json()["soal"]
    assert len(soal) == 6 and len(soal[0]["opsi"]) == 4


def test_tingkat_terkunci_lalu_terbuka(klien_masuk):
    assert klien_masuk.get("/api/latihan/sedang").status_code == 403
    klien_masuk.post("/api/progres", json={"modul_id": "latihan-mudah", "selesai": True, "skor": 50})
    assert klien_masuk.get("/api/latihan/sedang").status_code == 403
    klien_masuk.post("/api/progres", json={"modul_id": "latihan-mudah", "selesai": True, "skor": 80})
    assert klien_masuk.get("/api/latihan/sedang").status_code == 200
    assert klien_masuk.get("/api/latihan/sulit").status_code == 403


def test_skor_terbaik_disimpan(klien_masuk):
    klien_masuk.post("/api/progres", json={"modul_id": "latihan-mudah", "selesai": True, "skor": 80})
    klien_masuk.post("/api/progres", json={"modul_id": "latihan-mudah", "selesai": False, "skor": 40})
    modul = {m["modul_id"]: m for m in klien_masuk.get("/api/progres").get_json()["modul"]}
    assert modul["latihan-mudah"]["skor"] == 80 and modul["latihan-mudah"]["selesai"] is True


def test_modul_tidak_dikenal(klien_masuk):
    assert klien_masuk.post("/api/progres", json={"modul_id": "kuis", "skor": 100}).status_code == 400
    assert klien_masuk.post("/api/progres", json={"modul_id": "x"}).status_code == 400


def test_periksa_benar_dan_salah(klien_masuk):
    benar = klien_masuk.post("/api/periksa", json={"soal_id": "L1-06", "jawaban": 9}).get_json()
    assert benar["benar"] and "pembahasan" in benar
    salah = klien_masuk.post("/api/periksa", json={"soal_id": "L1-06", "jawaban": 36}).get_json()
    assert not salah["benar"] and salah["jenis_kesalahan"] == "salah_jenis"
    assert "pembahasan" not in salah
    kedua = klien_masuk.post("/api/periksa", json={"soal_id": "L1-06", "jawaban": 36, "percobaan": 2})
    assert "pembahasan" in kedua.get_json()


def test_periksa_soal_terkunci(klien_masuk):
    r = klien_masuk.post("/api/periksa", json={"soal_id": "L3-01", "jawaban": 45})
    assert r.status_code == 403


def test_hint_berurutan_dan_tercatat(klien_masuk):
    r = klien_masuk.get("/api/hint/L1-01/1")
    assert r.status_code == 200 and r.get_json()["total"] == 3
    assert klien_masuk.get("/api/hint/L1-01/4").status_code == 404
    modul = {m["modul_id"]: m for m in klien_masuk.get("/api/progres").get_json()["modul"]}
    assert modul["latihan-mudah"]["hint_dipakai"] == 1


def test_kuis(klien_masuk):
    soal = klien_masuk.get("/api/kuis").get_json()["soal"]
    assert len(soal) == 6 and all("kunci" not in s for s in soal)
    r = klien_masuk.post("/api/kuis/kirim", json={"jawaban": {"K-01": "Hasil kali kedua besaran", "K-03": 6}})
    data = r.get_json()
    assert data["skor"] == 33 and len(data["pembahasan"]) == 6
    progres = klien_masuk.get("/api/progres").get_json()
    assert progres["kuis_terakhir"]["skor"] == 33


def test_data_rahasia_tidak_bisa_diakses(klien):
    for path in ("/data/soal.json", "/static/../data/soal.json", "/static/data/../../data/kuis.json"):
        r = klien.get(path)
        assert r.status_code == 404
        assert b"kunci" not in r.data


def test_file_pwa_disajikan_dari_root(klien):
    sw = klien.get("/sw.js")
    assert sw.status_code == 200 and "javascript" in sw.content_type
    manifest = klien.get("/manifest.webmanifest")
    assert manifest.status_code == 200 and manifest.content_type.startswith("application/manifest+json")
    assert klien.get("/").status_code == 200


def test_kuis_jawaban_teks_panjang_tidak_terpotong(klien_masuk):
    """Regresi: jawaban K-06 (> 40 karakter) dulu terpotong sehingga dinilai salah."""
    from app import bank_soal

    semua_benar = {s["id"]: s["kunci"] for s in bank_soal.semua_kuis()}
    assert any(isinstance(v, str) and len(v) > 40 for v in semua_benar.values())
    data = klien_masuk.post("/api/kuis/kirim", json={"jawaban": semua_benar}).get_json()
    assert data["skor"] == 100
