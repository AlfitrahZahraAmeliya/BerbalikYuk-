"""Penilaian jawaban dan deteksi jenis kesalahan.

Modul ini MURNI: tidak memakai Flask, database, atau file. Semua masukan berupa
dict soal (dari data/*.json) dan jawaban siswa, sehingga mudah diuji.

Jenis kesalahan (lihat PRD.md §4):
  benar, salah_jenis, salah_baca, salah_hitung, lainnya
"""
import re

TOLERANSI = 0.01

NAMA_JENIS = {"berbalik": "Berbalik nilai", "senilai": "Senilai"}


# ---------- Utilitas angka ----------

def ke_angka(nilai):
    """Ubah jawaban siswa menjadi float. Menerima format Indonesia: '22,5', '20.000', 'Rp20.000'."""
    if isinstance(nilai, bool):
        return None
    if isinstance(nilai, (int, float)):
        return float(nilai)
    if not isinstance(nilai, str):
        return None
    teks = nilai.strip().lower().replace(" ", "").replace("rp", "")
    if not teks:
        return None
    if "," in teks:
        teks = teks.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"\d{1,3}(\.\d{3})+", teks):
        teks = teks.replace(".", "")
    try:
        return float(teks)
    except ValueError:
        return None


def sama(x, y):
    return x is not None and y is not None and abs(x - y) < TOLERANSI


def format_angka(x):
    """22.5 -> '22,5'; 20000 -> '20.000'."""
    if x is None:
        return "-"
    if abs(x - round(x)) < 1e-9:
        return f"{int(round(x)):,}".replace(",", ".")
    teks = f"{x:.2f}".rstrip("0").rstrip(".")
    bulat, _, desimal = teks.partition(".")
    bulat = f"{int(bulat):,}".replace(",", ".")
    return f"{bulat},{desimal}" if desimal else bulat


# ---------- Rumus ----------

def hitung_berbalik(nilai, ditanya):
    """a1 × b1 = a2 × b2"""
    if ditanya == "b2":
        return nilai["a1"] * nilai["b1"] / nilai["a2"]
    return nilai["a1"] * nilai["b1"] / nilai["b2"]


def hitung_senilai(nilai, ditanya):
    """a1 : b1 = a2 : b2"""
    if ditanya == "b2":
        return nilai["b1"] * nilai["a2"] / nilai["a1"]
    return nilai["a1"] * nilai["b2"] / nilai["b1"]


# ---------- Pesan ----------

def _kapital(teks):
    return teks[:1].upper() + teks[1:]


def _arah(soal):
    """Kembalikan (besaran_berubah, naik?, besaran_dicari, naik?) sesuai jenis soal."""
    nilai, label = soal["nilai"], soal["label"]
    berubah, dicari = ("a", "b") if soal["ditanya"] == "b2" else ("b", "a")
    naik = nilai[berubah + "2"] > nilai[berubah + "1"]
    dicari_naik = naik if soal.get("jenis") == "senilai" else not naik
    return label[berubah], naik, label[dicari], dicari_naik


def _kata(naik):
    return "bertambah" if naik else "berkurang"


def kunci_tampil(soal):
    if soal["tipe"] == "jenis":
        return NAMA_JENIS[soal["kunci"]]
    if soal["tipe"] == "pilihan_teks":
        return soal["kunci"]
    satuan = soal.get("satuan", "")
    if satuan == "rupiah":
        return "Rp" + format_angka(soal["kunci"])
    return f"{format_angka(soal['kunci'])} {satuan}".strip()


def pesan_benar(soal):
    awal = f"Tepat! {kunci_tampil(soal)}."
    if not soal.get("nilai"):
        return awal
    a, a_naik, b, b_naik = _arah(soal)
    return f"{awal} {_kapital(a)} {_kata(a_naik)}, {b} {_kata(b_naik)}. Masuk akal!"


def pesan_default(jenis_kesalahan, soal):
    if jenis_kesalahan == "salah_jenis":
        label = soal.get("label") or {"a": "besaran pertama", "b": "besaran kedua"}
        if soal.get("jenis") == "senilai":
            return (f"Coba cek lagi: jika {label['a']} bertambah, {label['b']} juga bertambah. "
                    "Ini perbandingan senilai, bukan berbalik nilai.")
        return (f"Hasilmu tidak sesuai arah hubungannya. Jika {label['a']} bertambah, "
                f"{label['b']} seharusnya berkurang. Ingat: hasil kalinya tetap.")
    if jenis_kesalahan == "salah_baca":
        return ("Cek lagi angka yang kamu ambil dari soal. Baca kalimatnya pelan-pelan, "
                "terutama kata 'menjadi', 'ditambah', 'dikurangi', atau 'setelah'.")
    if jenis_kesalahan == "salah_hitung":
        return "Rumusmu sudah benar. Periksa lagi perkalian dan pembagiannya."
    return "Belum tepat. Coba buka Petunjuk untuk membantumu."


def _hasil(benar, jenis_kesalahan, pesan):
    return {"benar": benar, "jenis_kesalahan": jenis_kesalahan, "pesan": pesan}


# ---------- Penilaian ----------

def _tabel_cocok(isian_tabel, nilai):
    for kunci, benar in nilai.items():
        if not sama(ke_angka(isian_tabel.get(kunci)), float(benar)):
            return False
    return True


def periksa_jawaban(soal, jawaban, isian_tabel=None, hubungan=None):
    """Nilai satu jawaban. Mengembalikan {benar, jenis_kesalahan, pesan}."""
    tipe = soal["tipe"]

    if tipe in ("jenis", "pilihan_teks"):
        if str(jawaban).strip() == str(soal["kunci"]):
            return _hasil(True, "benar", soal.get("pesan_benar") or f"Tepat! {kunci_tampil(soal)}.")
        if tipe == "jenis":
            return _hasil(False, "salah_jenis", soal.get("alasan") or pesan_default("salah_jenis", soal))
        for opsi in soal.get("opsi", []):
            if isinstance(opsi, dict) and opsi.get("teks") == jawaban and opsi.get("pesan"):
                return _hasil(False, opsi.get("jenis", "lainnya"), opsi["pesan"])
        return _hasil(False, "lainnya", pesan_default("lainnya", soal))

    # Soal berjawaban angka: pilihan_ganda atau isian
    x = ke_angka(jawaban)
    if x is None:
        return _hasil(False, "lainnya", "Tulis jawabanmu dalam bentuk angka, ya.")

    jenis_soal = soal.get("jenis", "berbalik")
    if hubungan is not None and hubungan != jenis_soal:
        return _hasil(False, "salah_jenis", pesan_default("salah_jenis", soal))

    if sama(x, float(soal["kunci"])):
        return _hasil(True, "benar", pesan_benar(soal))

    for daftar in (soal.get("opsi", []), soal.get("jawabanSalah", [])):
        for opsi in daftar:
            if isinstance(opsi, dict) and opsi.get("jenis") and sama(x, float(opsi["nilai"])):
                return _hasil(False, opsi["jenis"], opsi.get("pesan") or pesan_default(opsi["jenis"], soal))

    nilai = soal.get("nilai")
    if nilai:
        lawan = hitung_senilai if jenis_soal == "berbalik" else hitung_berbalik
        if sama(x, lawan(nilai, soal["ditanya"])):
            return _hasil(False, "salah_jenis", pesan_default("salah_jenis", soal))
        if isian_tabel:
            jenis = "salah_hitung" if _tabel_cocok(isian_tabel, nilai) else "salah_baca"
            return _hasil(False, jenis, pesan_default(jenis, soal))
        if jenis_soal == "berbalik" and sama(x, nilai["a1"] * nilai["b1"]):
            return _hasil(False, "salah_hitung",
                          "Kamu baru menghitung a₁ × b₁. Jangan lupa membaginya, ya.")

    return _hasil(False, "lainnya", pesan_default("lainnya", soal))


def nilai_kuis(daftar_soal, jawaban_siswa):
    """Nilai seluruh kuis. jawaban_siswa = {soal_id: jawaban}.

    Mengembalikan (skor 0–100, skor_per_tp {TP: 0–100}, rincian per soal).
    """
    rincian = []
    per_tp = {}
    jumlah_benar = 0
    for soal in daftar_soal:
        jawaban = jawaban_siswa.get(soal["id"])
        hasil = periksa_jawaban(soal, jawaban) if jawaban not in (None, "") else _hasil(
            False, "lainnya", "Soal ini belum dijawab.")
        jumlah_benar += hasil["benar"]
        for tp in soal.get("tp", []):
            benar, total = per_tp.get(tp, (0, 0))
            per_tp[tp] = (benar + hasil["benar"], total + 1)
        rincian.append({
            "id": soal["id"],
            "teks": soal["teks"],
            "jawabanmu": jawaban,
            "kunci": kunci_tampil(soal),
            "benar": hasil["benar"],
            "jenis_kesalahan": hasil["jenis_kesalahan"],
            "pembahasan": soal.get("pembahasan", ""),
        })
    skor = round(jumlah_benar / len(daftar_soal) * 100) if daftar_soal else 0
    skor_per_tp = {tp: round(b / t * 100) for tp, (b, t) in sorted(per_tp.items())}
    return skor, skor_per_tp, rincian
