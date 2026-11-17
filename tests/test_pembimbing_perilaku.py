"""Uji perilaku pedagogis Kak Balik (RMT + Cognitive Load) dan ketahanan pemanggilan Gemini.

Gemini SELALU ditiru: tes tidak memanggil Google.
"""
import httpx
import pytest

from app import bank_soal, pembimbing


@pytest.fixture(autouse=True)
def bersihkan_cache_model():
    pembimbing._MODEL_TIDAK_TERSEDIA.clear()
    yield
    pembimbing._MODEL_TIDAK_TERSEDIA.clear()


# ---------- Mengenali kebutuhan siswa ----------

@pytest.mark.parametrize("pesan,jenis", [
    ("Perbandingan berbalik nilai itu apa?", "konsep"),
    ("apa itu berbalik nilai", "konsep"),
    ("Kenapa harinya berkurang?", "konsep"),
    ("bedanya sama senilai apa?", "konsep"),
    ("kasih tau jawabannya dong", "minta_jawaban"),
    ("jawabannya berapa?", "minta_jawaban"),
    ("cek langkahku dong", "cek"),
    ("Apakah jawabanku masuk akal?", "cek"),
    ("aku bingung", "bingung"),
    ("Aku bingung mulai dari mana", "bingung"),
    ("4 kali 15 itu 60", "lainnya"),
])
def test_klasifikasi_pertanyaan(pesan, jenis):
    assert pembimbing.klasifikasi_pertanyaan(pesan) == jenis


def test_tingkat_bantuan_naik_bertahap():
    siswa = {"peran": "siswa", "teks": "x"}
    guru = {"peran": "pembimbing", "teks": "y"}
    assert pembimbing.tingkat_bantuan([], {}, "lainnya") == 1
    assert pembimbing.tingkat_bantuan([siswa, guru], {}, "lainnya") == 2
    assert pembimbing.tingkat_bantuan([siswa, guru], {"percobaan": 2}, "bingung") == 4
    assert pembimbing.tingkat_bantuan([siswa, guru] * 5, {}, "lainnya") == 4  # maksimal 4


# ---------- Cadangan statis yang kontekstual ----------

GENERIK = "Coba baca lagi bagian di atas pelan-pelan. Bagian mana yang membuatmu bingung?"


def test_cadangan_pertanyaan_konsep_berisi_penjelasan_bukan_generik():
    data = pembimbing.cari_sumber("materi", "1:1")
    teks = pembimbing.petunjuk_cadangan("materi", data, {}, 0, pesan="Perbandingan berbalik nilai itu apa?")
    assert "hasil kali" in teks and "berkurang" in teks
    assert teks != GENERIK


def test_cadangan_konsep_sesuai_topik():
    data = pembimbing.cari_sumber("materi", "6:0")
    teks = pembimbing.petunjuk_cadangan("materi", data, {}, 0, pesan="Bedanya dengan senilai apa?")
    assert "hasil bagi" in teks


def test_cadangan_materi_tidak_pernah_kalimat_generik_lama():
    materi = pembimbing._data_statis("materi.json")
    for id_materi, isi in materi.items():
        for indeks in range(len(isi["layar"])):
            data = pembimbing.cari_sumber("materi", f"{id_materi}:{indeks}")
            assert pembimbing.petunjuk_cadangan("materi", data, {}, 0, pesan="hmm") != GENERIK


def test_cadangan_tidak_mengulang_balasan_sebelumnya():
    data = pembimbing.cari_sumber("materi", "1:1")
    pertama = pembimbing.petunjuk_cadangan("materi", data, {}, 0, pesan="hmm")
    riwayat = [{"peran": "siswa", "teks": "hmm"}, {"peran": "pembimbing", "teks": pertama}]
    kedua = pembimbing.petunjuk_cadangan("materi", data, {}, 1, pesan="hmm", riwayat=riwayat)
    assert kedua != pertama


def test_cadangan_latihan_mengikuti_tingkat_bantuan():
    soal = bank_soal.cari_latihan("L1-01")
    for n in range(3):
        assert pembimbing.petunjuk_cadangan("latihan", soal, {}, n, pesan="bingung", jenis="bingung") == soal["hint"][n]


# ---------- Riwayat & konteks ----------

def test_riwayat_selalu_bergantian_dan_diakhiri_pembimbing():
    riwayat = [
        {"peran": "pembimbing", "teks": "salam"},           # dibuang: harus dimulai dari siswa
        {"peran": "siswa", "teks": "a"}, {"peran": "siswa", "teks": "b"},  # digabung
        {"peran": "pembimbing", "teks": "c"},
        {"peran": "siswa", "teks": "d"},                     # dibuang: pesan baru dikirim terpisah
    ]
    hasil = pembimbing.bersihkan_riwayat(riwayat)
    assert [g["peran"] for g in hasil] == ["siswa", "pembimbing"]
    assert hasil[0]["teks"] == "a\nb"


def test_konteks_memuat_jenis_tingkat_dan_balasan_sebelumnya():
    soal = bank_soal.cari_latihan("L1-01")
    riwayat = [{"peran": "siswa", "teks": "bingung"}, {"peran": "pembimbing", "teks": "Coba isi tabelnya dulu."}]
    teks = pembimbing.bangun_konteks("latihan", soal, {}, "elaborasi", "bingung", 3, riwayat)
    assert "JENIS PESAN" in teks and "TINGKAT BANTUAN (ZPD)" in teks and "Langkah terpandu" in teks
    assert "BALASANMU SEBELUMNYA (jangan diulang): Coba isi tabelnya dulu." in teks


def test_prompt_memuat_prinsip_rmt_dan_beban_kognitif():
    teks = pembimbing.prompt_sistem("Kak Balik")
    for frasa in ("MEDIATOR", "RESIPROSITAS", "PEMBENTUKAN KONSEP", "amati", "bandingkan", "temukan_pola",
                  "simpulkan", "terapkan", "INPUT", "ELABORASI", "OUTPUT", "ZPD", "REPRESENTASI",
                  "Intensionalitas", "Makna", "Transendensi", "METAKOGNISI", "Intrinsik", "Ekstrinsik",
                  "Germane", "JANGAN PERNAH menyebut jawaban akhir", "JANGAN mengulang", "giliran_siswa"):
        assert frasa in teks, frasa


def test_rapikan_balasan_buang_markdown():
    assert pembimbing.rapikan_balasan("**Tabel** dulu ya") == "Tabel dulu ya"


# ---------- Pemanggilan Gemini: rotasi model ----------

class Respons:
    def __init__(self, status, data=None):
        self.status_code = status
        self._data = data or {}

    def json(self):
        return self._data


def balasan_ok(teks):
    return Respons(200, {"candidates": [{"content": {"parts": [{"text": teks}]}}]})


CONFIG = {"GEMINI_API_KEY": "palsu", "GEMINI_MODEL": "model-mati", "GEMINI_URL_DASAR": "http://tiruan"}


def test_model_tidak_tersedia_diganti_model_cadangan(monkeypatch):
    dipanggil = []

    def post(url, json, timeout, headers):
        dipanggil.append(url.split("/models/")[1].split(":")[0])
        assert "thinkingConfig" not in json["generationConfig"]  # ditolak model baru
        assert headers["x-goog-api-key"] == "palsu" and "palsu" not in url
        return Respons(404) if len(dipanggil) == 1 else balasan_ok("Halo!")

    monkeypatch.setattr(httpx, "post", post)
    assert pembimbing.minta_gemini(CONFIG, "sistem", [], "hai") == "Halo!"
    assert dipanggil == ["model-mati", pembimbing.MODEL_CADANGAN[0]]
    # Model yang 404 tidak dicoba lagi pada permintaan berikutnya.
    assert "model-mati" not in pembimbing.daftar_model(CONFIG)


def test_model_sibuk_dan_timeout_dilewati(monkeypatch):
    urutan = iter([Respons(503), httpx.ReadTimeout("lambat"), balasan_ok("Akhirnya")])

    def post(*_, **__):
        hasil = next(urutan)
        if isinstance(hasil, Exception):
            raise hasil
        return hasil

    monkeypatch.setattr(httpx, "post", post)
    assert pembimbing.minta_gemini(CONFIG, "s", [], "hai") == "Akhirnya"


def test_semua_model_gagal_melempar_galat(monkeypatch):
    monkeypatch.setattr(httpx, "post", lambda *a, **k: Respons(503))
    with pytest.raises(pembimbing.GalatPembimbing):
        pembimbing.minta_gemini(CONFIG, "s", [], "hai")


def test_daftar_model_dari_env_dipisah_koma():
    config = {**CONFIG, "GEMINI_MODEL": "a, b ,a"}
    assert pembimbing.daftar_model(config)[:2] == ["a", "b"]


# ---------- Alur endpoint ----------

@pytest.fixture
def ai(app, klien_masuk, monkeypatch):
    app.config["GEMINI_API_KEY"] = "kunci-palsu-untuk-uji"
    panggilan = []

    def tiruan(config, sistem, riwayat, pesan):
        panggilan.append(sistem)
        return tiruan.balasan.pop(0) if isinstance(tiruan.balasan, list) else tiruan.balasan

    tiruan.balasan = "Penjelasan baru."
    monkeypatch.setattr(pembimbing, "minta_gemini", tiruan)
    return {"klien": klien_masuk, "panggilan": panggilan, "tiruan": tiruan}


def test_balasan_berulang_diminta_ulang(ai):
    lama = "Kalau pekerjanya bertambah, harinya bertambah atau berkurang?"
    ai["tiruan"].balasan = [lama, "Kita isi tabelnya: a₁ = 4, b₁ = 15, a₂ = 6. Berapa 4 × 15?"]
    riwayat = [{"peran": "siswa", "teks": "bingung"}, {"peran": "pembimbing", "teks": lama}]
    data = ai["klien"].post("/api/pembimbing", json={
        "sumber": "latihan", "ref": "L1-01", "fase": "elaborasi", "pesan": "masih bingung", "riwayat": riwayat,
    }).get_json()
    assert data["balasan"].startswith("Kita isi tabelnya")
    assert len(ai["panggilan"]) == 2 and "PERINGATAN" in ai["panggilan"][1]


def test_pertanyaan_konsep_dikirim_dengan_penanda_konsep(ai):
    ai["klien"].post("/api/pembimbing", json={
        "sumber": "materi", "ref": "1:1", "pesan": "Perbandingan berbalik nilai itu apa?",
    })
    assert "JENIS PESAN (perkiraan sistem): pertanyaan konsep" in ai["panggilan"][0]
    assert "TAHAP BERIKUT: amati" in ai["panggilan"][0]


def test_konsep_saat_ai_gagal_tetap_dijelaskan(ai, monkeypatch):
    def gagal(*_):
        raise pembimbing.GalatPembimbing("uji")
    monkeypatch.setattr(pembimbing, "minta_gemini", gagal)
    data = ai["klien"].post("/api/pembimbing", json={
        "sumber": "materi", "ref": "1:1", "pesan": "Perbandingan berbalik nilai itu apa?",
    }).get_json()
    assert data["cadangan"] is True
    assert "hasil kali" in data["balasan"] and data["balasan"] != GENERIK
