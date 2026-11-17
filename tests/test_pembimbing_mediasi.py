"""Uji logika mediasi RMT + Cognitive Load yang diputuskan server (fungsi murni & endpoint).

Gemini SELALU ditiru: tes tidak memanggil Google.
"""
import json

import pytest

from app import pembimbing as p


def guru(tahap=None, penilaian=None, representasi=None, teks="..."):
    return {"peran": "pembimbing", "teks": teks,
            "meta": {k: v for k, v in (("tahap", tahap), ("penilaian", penilaian),
                                        ("representasi", representasi)) if v}}


SISWA = {"peran": "siswa", "teks": "x"}


# ---------- Alur pembentukan konsep (amati → bandingkan → temukan pola → simpulkan → terapkan) ----------

def test_pertanyaan_konsep_dimulai_dari_mengamati():
    assert p.tahap_konsep_berikut("konsep", []) == ("amati", False)


def test_tahap_maju_jika_respons_siswa_tepat():
    metas = p.meta_pembimbing([SISWA, guru("amati", "tidak_ada", "tabel")])
    assert p.tahap_konsep_berikut("lainnya", metas) == ("bandingkan", False)
    metas = p.meta_pembimbing([SISWA, guru("bandingkan", "benar", "tabel")])
    assert p.tahap_konsep_berikut("lainnya", metas) == ("temukan_pola", False)


def test_tahap_diulang_jika_siswa_keliru_atau_bingung():
    metas = p.meta_pembimbing([SISWA, guru("temukan_pola", "keliru")])
    assert p.tahap_konsep_berikut("lainnya", metas) == ("temukan_pola", False)
    metas = p.meta_pembimbing([SISWA, guru("temukan_pola", "benar")])
    assert p.tahap_konsep_berikut("bingung", metas) == ("temukan_pola", False)


def test_bingung_dua_kali_berturut_maka_jelaskan_lengkap():
    """Regresi uji langsung: siswa bilang 'bingung' dua kali tanpa dinilai keliru."""
    riwayat = [{"peran": "siswa", "teks": "kenapa harinya turun?"}, guru("amati", "tidak_ada", "tabel"),
               {"peran": "siswa", "teks": "aku masih bingung"}, guru("amati", "tidak_ada", "gambar_kata")]
    metas = p.meta_pembimbing(riwayat)
    assert p.kesulitan_beruntun("bingung", metas, riwayat) == 2
    assert p.tahap_konsep_berikut("bingung", metas, riwayat) == ("jelaskan", True)


def test_dua_kali_kesulitan_beruntun_maka_jelaskan_lengkap():
    metas = p.meta_pembimbing([SISWA, guru("amati", "keliru")])
    assert p.tahap_konsep_berikut("bingung", metas) == ("jelaskan", True)
    # setelah penjelasan lengkap → transendensi
    metas = p.meta_pembimbing([SISWA, guru("jelaskan", "tidak_ada")])
    assert p.tahap_konsep_berikut("lainnya", metas) == ("terapkan", False)


# ---------- Representasi (alat psikologis): ganti saat masih bingung ----------

def test_representasi_bebas_jika_tidak_bingung():
    assert p.representasi_berikut([{"representasi": "tabel"}], bingung=False) is None


def test_bingung_pindah_ke_representasi_lebih_konkret_yang_belum_dipakai():
    metas = [{"representasi": "rumus"}]
    assert p.representasi_berikut(metas, bingung=True) == "pola_hasil_kali"
    metas = [{"representasi": "tabel"}, {"representasi": "gambar_kata"}]
    assert p.representasi_berikut(metas, bingung=True) == "cerita_konkret"


def test_representasi_tidak_pernah_mengulang_yang_terakhir():
    semua = [{"representasi": r} for r in p.TANGGA_REPRESENTASI]
    pilihan = p.representasi_berikut(semua, bingung=True)
    assert pilihan in p.TANGGA_REPRESENTASI and pilihan != "rumus"


# ---------- Metakognisi ----------

@pytest.mark.parametrize("metas,mode,harapan", [
    ([], "bimbing", False),
    ([{"penilaian": "benar"}], "bimbing", True),           # baru menjawab tepat → minta alasan
    ([{"tahap": "simpulkan"}], "bimbing", True),
    ([{"tahap": "validasi"}], "bimbing", True),
    ([{}, {}, {}], "bimbing", True),                        # tiap 3 giliran
    ([{"penilaian": "keliru"}], "bimbing", False),
    ([], "refleksi", True),
])
def test_perlu_metakognisi(metas, mode, harapan):
    assert p.perlu_metakognisi(metas, mode) is harapan


def test_tingkat_bantuan_naik_saat_respons_siswa_keliru():
    assert p.tingkat_bantuan([SISWA, guru("amati", "keliru")], {}, "lainnya") == 3


# ---------- Rencana mediasi & konteks ----------

def test_rencana_soal_latihan_memakai_alur_soal():
    r = p.rencana_mediasi("latihan", "bingung", 2, [])
    assert r["alur"] == "soal" and r["tahap"] is None


def test_rencana_konsep_di_latihan_tetap_alur_konsep():
    r = p.rencana_mediasi("latihan", "konsep", 1, [])
    assert r["alur"] == "konsep" and r["tahap"] == "amati"


def test_konteks_memuat_keputusan_mediasi():
    riwayat = [SISWA, guru("amati", "keliru", "tabel", "2 orang → 6 jam")]
    teks = p.bangun_konteks("umum", {"halaman": "beranda"}, {}, None, "bingung", 4, riwayat)
    assert "TAHAP BERIKUT: jelaskan" in teks and "JELASKAN LENGKAP" in teks
    assert "REPRESENTASI YANG SUDAH DIPAKAI: tabel" in teks
    assert "REPRESENTASI WAJIB" in teks and "gambar_kata" in teks
    assert "KERUMITAN (beban intrinsik): turunkan" in teks


# ---------- Balasan terstruktur ----------

def test_urai_balasan_json():
    teks = json.dumps({"balasan": "Amati tabel ini.\n2 orang → 6 jam", "giliran_siswa": "Apa yang berubah?",
                       "tahap": "amati", "penilaian_respons": "tidak_ada", "representasi": "tabel"})
    h = p.urai_balasan(teks)
    assert h == {"balasan": "Amati tabel ini.\n2 orang → 6 jam", "giliran_siswa": "Apa yang berubah?",
                 "tahap": "amati", "penilaian_respons": "tidak_ada", "representasi": "tabel"}


def test_urai_balasan_teks_biasa_dan_nilai_asing():
    assert p.urai_balasan("Halo!")["balasan"] == "Halo!"
    h = p.urai_balasan('```json\n{"balasan": "B", "giliran_siswa": "G", "tahap": "terbang"}\n```')
    assert h["balasan"] == "B" and h["giliran_siswa"] == "G" and h["tahap"] is None


def test_riwayat_menyimpan_meta_yang_valid_saja():
    riwayat = [{"peran": "siswa", "teks": "a"},
               {"peran": "pembimbing", "teks": "b", "meta": {"tahap": "amati", "penilaian": "hebat", "x": 1}}]
    hasil = p.bersihkan_riwayat(riwayat)
    assert hasil[1]["meta"] == {"tahap": "amati"}


def test_sumber_umum():
    assert p.cari_sumber("umum", "beranda") == {"halaman": "beranda"}
    assert p.cari_sumber("umum", "kuis") is None


# ---------- Endpoint ----------

@pytest.fixture
def ai(app, klien_masuk, monkeypatch):
    app.config["GEMINI_API_KEY"] = "kunci-palsu-untuk-uji"
    panggilan = []

    def tiruan(config, sistem, riwayat, pesan):
        panggilan.append({"sistem": sistem, "riwayat": riwayat})
        return tiruan.balasan

    tiruan.balasan = json.dumps({"balasan": "Kita amati dulu:\n2 orang → 6 jam\n4 orang → 3 jam",
                                 "giliran_siswa": "Apa yang terjadi pada waktunya?", "tahap": "amati",
                                 "penilaian_respons": "tidak_ada", "representasi": "tabel"})
    monkeypatch.setattr(p, "minta_gemini", tiruan)
    return {"klien": klien_masuk, "panggilan": panggilan, "tiruan": tiruan, "app": app}


def test_endpoint_mengembalikan_giliran_dan_meta(ai):
    d = ai["klien"].post("/api/pembimbing", json={
        "sumber": "umum", "ref": "beranda", "pesan": "Perbandingan berbalik nilai itu apa?"}).get_json()
    assert d["giliran_siswa"] == "Apa yang terjadi pada waktunya?"
    assert d["meta"] == {"tahap": "amati", "penilaian": "tidak_ada", "representasi": "tabel"}
    repo = ai["app"].extensions["repo"]
    with repo._koneksi() as kon:
        balasan, fase = kon.execute("select balasan, fase from bimbingan_ai").fetchone()
    assert balasan.endswith("Giliranmu: Apa yang terjadi pada waktunya?") and fase == "amati"


def test_endpoint_umum_ref_tidak_dikenal(ai):
    r = ai["klien"].post("/api/pembimbing", json={"sumber": "umum", "ref": "kuis", "pesan": "hai"})
    assert r.status_code == 404


def test_meta_riwayat_diteruskan_ke_konteks(ai):
    riwayat = [{"peran": "siswa", "teks": "itu apa?"},
               {"peran": "pembimbing", "teks": "2 orang → 6 jam\nGiliranmu: Apa yang berubah?",
                "meta": {"tahap": "amati", "penilaian": "tidak_ada", "representasi": "tabel"}}]
    ai["klien"].post("/api/pembimbing", json={
        "sumber": "materi", "ref": "1:1", "pesan": "waktunya berkurang", "riwayat": riwayat})
    assert "TAHAP BERIKUT: bandingkan" in ai["panggilan"][0]["sistem"]


def test_jawaban_di_giliran_siswa_juga_disaring(ai):
    ai["tiruan"].balasan = json.dumps({"balasan": "Hampir!", "giliran_siswa": "Benar kan jawabannya 10 hari?",
                                       "tahap": "output", "penilaian_respons": "sebagian", "representasi": "rumus"})
    d = ai["klien"].post("/api/pembimbing", json={
        "sumber": "latihan", "ref": "L1-01", "pesan": "cek dong"}).get_json()
    assert d["tersaring"] is True and "10 hari" not in json.dumps(d)
    assert d["giliran_siswa"] == ""
