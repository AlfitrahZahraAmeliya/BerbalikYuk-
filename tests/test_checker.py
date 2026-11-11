"""Uji penilaian untuk SELURUH bank soal, agar kunci & opsi salah selalu konsisten."""
import pytest

from app import bank_soal
from app.checker import (
    format_angka, hitung_berbalik, hitung_senilai, ke_angka, nilai_kuis, periksa_jawaban, sama,
)

SEMUA_SOAL = bank_soal.semua_latihan() + bank_soal.semua_kuis()
SOAL_ANGKA = [s for s in SEMUA_SOAL if s["tipe"] in ("pilihan_ganda", "isian")]


def _id(soal):
    return soal["id"]


@pytest.mark.parametrize("soal", SEMUA_SOAL, ids=_id)
def test_kunci_selalu_benar(soal):
    hasil = periksa_jawaban(soal, soal["kunci"])
    assert hasil["benar"] and hasil["jenis_kesalahan"] == "benar"


@pytest.mark.parametrize("soal", SOAL_ANGKA, ids=_id)
def test_kunci_sesuai_rumus(soal):
    """Kunci di bank soal harus sama dengan hasil rumus (kecuali soal 'tambahan')."""
    rumus = hitung_senilai if soal.get("jenis") == "senilai" else hitung_berbalik
    hasil = rumus(soal["nilai"], soal["ditanya"])
    if soal["id"] == "L3-04":  # yang ditanya tambahan pekerja: a₂ − a₁
        hasil -= soal["nilai"]["a1"]
    assert sama(hasil, soal["kunci"])


@pytest.mark.parametrize("soal", SOAL_ANGKA, ids=_id)
def test_opsi_salah_terdeteksi_sesuai_jenisnya(soal):
    for opsi in soal.get("opsi", []) + soal.get("jawabanSalah", []):
        if "jenis" in opsi:
            hasil = periksa_jawaban(soal, opsi["nilai"])
            assert not hasil["benar"]
            assert hasil["jenis_kesalahan"] == opsi["jenis"], opsi


@pytest.mark.parametrize("soal", [s for s in SOAL_ANGKA if s["tipe"] == "pilihan_ganda"], ids=_id)
def test_pilihan_ganda_punya_satu_kunci_dan_tiga_pengecoh(soal):
    tanpa_jenis = [o for o in soal["opsi"] if "jenis" not in o]
    assert len(soal["opsi"]) == 4
    assert len(tanpa_jenis) == 1 and sama(tanpa_jenis[0]["nilai"], soal["kunci"])


@pytest.mark.parametrize("soal", SOAL_ANGKA, ids=_id)
def test_hasil_rumus_lawan_adalah_salah_jenis(soal):
    lawan = hitung_berbalik if soal.get("jenis") == "senilai" else hitung_senilai
    nilai_lawan = lawan(soal["nilai"], soal["ditanya"])
    if sama(nilai_lawan, soal["kunci"]):
        pytest.skip("hasil rumus lawan kebetulan sama dengan kunci")
    assert periksa_jawaban(soal, nilai_lawan)["jenis_kesalahan"] == "salah_jenis"


def test_hubungan_salah_langsung_salah_jenis():
    soal = bank_soal.cari_latihan("L2-05")  # senilai
    hasil = periksa_jawaban(soal, 20000, hubungan="berbalik")
    assert hasil["jenis_kesalahan"] == "salah_jenis"


def test_tabel_benar_hasil_salah_adalah_salah_hitung():
    soal = bank_soal.cari_latihan("L2-04")
    tabel = {"a1": "24", "b1": "15", "a2": "18"}
    assert periksa_jawaban(soal, 21, tabel, "berbalik")["jenis_kesalahan"] == "salah_hitung"


def test_tabel_salah_adalah_salah_baca():
    soal = bank_soal.cari_latihan("L2-04")
    tabel = {"a1": "15", "b1": "24", "a2": "18"}
    assert periksa_jawaban(soal, 21, tabel, "berbalik")["jenis_kesalahan"] == "salah_baca"


def test_format_indonesia():
    assert ke_angka("22,5") == 22.5
    assert ke_angka("20.000") == 20000
    assert ke_angka("Rp20.000") == 20000
    assert ke_angka("2.5") == 2.5
    assert ke_angka("abc") is None
    assert format_angka(22.5) == "22,5"
    assert format_angka(20000) == "20.000"


def test_jawaban_bukan_angka():
    soal = bank_soal.cari_latihan("L1-01")
    assert periksa_jawaban(soal, "sepuluh")["benar"] is False


def test_pesan_benar_menyebut_arah():
    soal = bank_soal.cari_latihan("L1-06")
    assert periksa_jawaban(soal, 9)["pesan"] == "Tepat! 9 hari. Pekerja bertambah, hari berkurang. Masuk akal!"


def test_nilai_kuis():
    kuis = bank_soal.semua_kuis()
    semua_benar = {s["id"]: s["kunci"] for s in kuis}
    skor, per_tp, rincian = nilai_kuis(kuis, semua_benar)
    assert skor == 100 and all(v == 100 for v in per_tp.values())
    assert set(per_tp) == {"TP1", "TP2", "TP3", "TP4", "TP5"}
    skor, _, rincian = nilai_kuis(kuis, {})
    assert skor == 0 and len(rincian) == len(kuis)
