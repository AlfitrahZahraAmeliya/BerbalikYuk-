"""Memuat bank soal dari folder data/ (RAHASIA, tidak disajikan sebagai file statis)."""
import json
import os
import random
from functools import lru_cache

FOLDER_DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

TINGKAT = ("mudah", "sedang", "sulit")
SYARAT_BUKA = {"sedang": "latihan-mudah", "sulit": "latihan-sedang"}
SKOR_MINIMAL_BUKA = 60

# Kolom yang boleh dikirim ke HP siswa. Kunci, jawaban salah, nilai, hint,
# dan pembahasan TIDAK termasuk.
KOLOM_PUBLIK = ("id", "tingkat", "tipe", "teks", "label", "satuan", "ditanya")


def _muat(nama_file):
    with open(os.path.join(FOLDER_DATA, nama_file), encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def semua_latihan():
    return _muat("soal.json")


@lru_cache(maxsize=1)
def semua_kuis():
    return _muat("kuis.json")


@lru_cache(maxsize=1)
def _indeks_latihan():
    return {s["id"]: s for s in semua_latihan()}


def cari_latihan(soal_id):
    return _indeks_latihan().get(soal_id)


def latihan_per_tingkat(tingkat):
    return [s for s in semua_latihan() if s["tingkat"] == tingkat]


def soal_publik(soal, acak=True):
    """Salinan soal tanpa informasi rahasia. Opsi diacak dan hanya berisi nilai/teks."""
    publik = {k: soal[k] for k in KOLOM_PUBLIK if k in soal}
    if soal["tipe"] == "jenis":
        publik["opsi"] = ["senilai", "berbalik"]
    elif "opsi" in soal:
        opsi = [o["teks"] if "teks" in o else o["nilai"] for o in soal["opsi"]]
        if acak:
            random.shuffle(opsi)
        publik["opsi"] = opsi
    publik["jumlah_hint"] = len(soal.get("hint", []))
    return publik
