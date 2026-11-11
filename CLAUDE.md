# CLAUDE.md — Panduan untuk AI Asisten

Panduan ini dibaca oleh AI asisten (Claude Code) setiap kali bekerja di proyek ini.

## Ringkasan Proyek
**BerbalikYuk!** adalah aplikasi belajar **Perbandingan Berbalik Nilai** untuk siswa SMP kelas 7. Aplikasi ini berbentuk **Progressive Web App (PWA)**: bisa dibuka di browser HP/komputer dan **dipasang di layar utama HP tanpa Play Store/App Store**. Desainnya berdasarkan **Cognitive Load Theory** dan model **ADDIE**, dengan data dari wawancara siswa. Pengguna: **siswa saja**.

**Baca dulu sebelum mengubah fitur atau tampilan:**
- [ANALISIS.md](ANALISIS.md): temuan wawancara (kode K/IL/EL/GL/DS) → implikasi desain
- [PRD.md](PRD.md): fitur F1–F11, menu, user stories, skema data
- [DESAIN.md](DESAIN.md): prinsip CLT, design tokens (adaptasi mockup), wireframe, bank soal

Setiap fitur baru harus bisa dirujuk ke ID fitur di PRD dan, jika memungkinkan, ke kode temuan di ANALISIS.

## Stack
| Lapisan | Teknologi |
|---|---|
| Backend | **Python 3.11+**, **Flask 3**, `supabase` (supabase-py), `python-dotenv`, `werkzeug.security` |
| Frontend | **JavaScript murni** (ES modules), HTML, CSS. **Tanpa** framework (React/Vue) dan **tanpa** bundler |
| PWA | `manifest.webmanifest` + service worker `sw.js` |
| Database | **Supabase** (PostgreSQL), diakses **hanya dari Flask** |
| Hosting | **Vercel** (runtime Python, HTTPS gratis). Alternatif: Render |
| Uji | `pytest` |

Versi dipatok di `requirements.txt` (mis. `Flask==3.0.3`, `supabase==2.34.1`, `python-dotenv==1.0.1`, `pytest==8.3.3`). Font Nunito dari Google Fonts. Jangan menambah library frontend.

## Arsitektur
```
HP / Browser (JS, PWA)  ──HTTPS/JSON──>  Flask (Python)  ──>  Supabase (PostgreSQL)
```
- Frontend hanya berbicara dengan Flask lewat `/api/*`. **Frontend tidak pernah memakai kunci Supabase.**
- Flask menyajikan file statis (SPA) dan API.
- Bank soal beserta kunci jawaban ada di `data/` (server). API mengirim soal **tanpa** `kunci`, `jawabanSalah`, dan `jenis` pada opsi.

## Struktur Folder
```
run.py                       # titik masuk lokal: app = create_app()
api/index.py                 # titik masuk Vercel: from app import create_app; app = create_app()
vercel.json                  # rewrite semua path ke api/index.py
requirements.txt
.env.example                 # SUPABASE_URL, SUPABASE_SERVICE_KEY, SECRET_KEY, FLASK_ENV
app/
  __init__.py                # create_app(): config, blueprint, header keamanan
  config.py                  # membaca .env; pengaturan cookie sesi
  db.py                      # get_supabase(): klien supabase-py (service_role)
  auth.py                    # daftar, masuk, keluar, dekorator @wajib_login
  bank_soal.py               # memuat data/*.json sekali; soal_publik() membuang kunci
  checker.py                 # FUNGSI MURNI: periksa_jawaban(), deteksi jenis kesalahan
  routes_halaman.py          # "/", "/sw.js", "/manifest.webmanifest" (disajikan dari root)
  routes_api.py              # semua endpoint /api/*
data/                        # RAHASIA — tidak boleh disajikan sebagai file statis
  soal.json                  # latihan mudah/sedang/sulit (16 soal)
  kuis.json
static/
  index.html                 # shell SPA
  manifest.webmanifest
  sw.js
  icons/                     # icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
  img/                       # ilustrasi SVG/WebP
  css/  tokens.css, base.css, components.css
  js/
    app.js                   # bootstrap: cek sesi, daftar service worker, router
    router.js                # hash router (#/beranda, #/materi/3, #/latihan/mudah, …)
    api.js                   # SEMUA fetch ke /api/* lewat sini (credentials: 'same-origin')
    pwa.js                   # beforeinstallprompt, deteksi iOS & standalone, banner pasang
    halaman/  masuk.js, beranda.js, materi.js, simulasi.js, contoh.js,
              latihan.js, kuis.js, progres.js, pengaturan.js
    komponen/ umum.js (kepala, panel umpan balik, hint), tabel-rumus.js, simulasi.js
  data/                      # PUBLIK — di-cache untuk offline
    materi.json              # isi Cek Prasyarat & Materi 1–6 per layar (dinilai di HP; formatif)
    contoh.json              # 3 contoh soal + pembahasan (bukan bahan penilaian)
supabase/schema.sql          # salinan SQL dari PRD.md §7
tools/buat_ikon.py           # membuat ikon PNG (python tools/buat_ikon.py)
tests/
  test_checker.py
  test_api.py                # memakai app.test_client() dan DB tiruan (mock get_supabase)
```

## Kontrak API
Semua request/response berupa JSON. Endpoint selain daftar/masuk wajib login (`@wajib_login`) dan mengembalikan `401` jika belum login.

| Metode & path | Body / parameter | Respons |
|---|---|---|
| POST `/api/daftar` | `{nama, kelas, username, sandi}` | `201 {siswa}` · `409` username sudah dipakai · `400` validasi |
| POST `/api/masuk` | `{username, sandi}` | `200 {siswa}` · `401` |
| POST `/api/keluar` | — | `204` |
| GET `/api/saya` | — | `{id, nama, kelas, username}` |
| GET `/api/progres` | — | `[{modul_id, selesai, skor, hint_dipakai}]` |
| POST `/api/progres` | `{modul_id, selesai, skor?}` | `200` (upsert; skor yang disimpan = skor terbaik) |
| GET `/api/latihan/<tingkat>` | `mudah` · `sedang` · `sulit` | daftar soal publik; `403` jika tingkat belum terbuka |
| GET `/api/hint/<soal_id>/<n>` | n = 1–3 | `{hint}`; mencatat hint tertinggi yang dibuka |
| POST `/api/periksa` | `{soal_id, jawaban, isian_tabel?, hint_level, durasi_detik}` | `{benar, jenis_kesalahan, pesan, pembahasan?}` |
| GET `/api/kuis` | — | 6 soal publik |
| POST `/api/kuis/kirim` | `{jawaban: {soal_id: nilai}}` | `{skor, skor_per_tp, pembahasan: [...]}` |

Format galat seragam: `{"galat": "pesan ramah untuk siswa"}`.

## Konvensi Kode
**Python**
- PEP 8, `snake_case`, nama dalam Bahasa Indonesia boleh (`periksa_jawaban`, `soal_publik`).
- `checker.py` **murni**: tanpa Flask, tanpa Supabase, tanpa I/O. Mudah diuji.
- Validasi semua input di server (tipe, panjang, `soal_id` ada, tingkat valid). Jangan percaya data dari klien.
- Akses Supabase hanya lewat `db.py`. Setiap query **wajib** difilter `siswa_id = session["siswa_id"]`.

**JavaScript**
- `camelCase`; nama file `kebab-case`.
- Semua `fetch` lewat `api.js`, yang menangani `401` (arahkan ke `#/masuk`) dan offline (pesan "Butuh internet").
- Teks materi dari `static/data/*.json`, bukan di-hardcode di JS.
- Setiap halaman mengekspor `render(container, params)` dan membersihkan listener-nya sendiri.
- Angka ditampilkan dengan format Indonesia (`toLocaleString('id-ID')`); input menerima koma maupun titik, lalu dikirim sebagai angka.

**CSS**
- *Mobile-first*: gaya dasar untuk 360 px, `@media (min-width: 768px)` untuk layar lebar. Lebar konten maks. 480 px.
- Pakai variabel di `tokens.css`; jangan menulis kode warna langsung di komponen.
- Perhatikan *safe area* saat terpasang: `padding-bottom: env(safe-area-inset-bottom)` pada navigasi bawah.
- Opsi Huruf Besar = kelas `huruf-besar` di `<html>` yang menaikkan variabel ukuran font.

## Aturan Cognitive Load (WAJIB)
Saat menambah atau mengubah UI, patuhi [DESAIN.md](DESAIN.md):
1. Satu konsep per layar; ≤ 40 kata di luar teks soal.
2. Soal + tabel + rumus terlihat bersamaan (kartu soal *sticky*). Jangan memisahkannya ke layar atau pop-up lain.
3. Ilustrasi **hanya** di Beranda, kartu pembuka materi, simulasi, dan trofi statis hasil kuis (DESAIN.md §3).
4. **Tanpa confetti**, animasi dekoratif, suara, atau warna di luar token.
5. Tidak ada yang berganti otomatis; siswa yang menekan **Lanjut**.
6. Umpan balik muncul di bawah soal dan menyebutkan jenis kesalahan.
7. Rumus utama **a₁ × b₁ = a₂ × b₂**. Bentuk pecahan hanya di Materi 5.
8. Hormati `prefers-reduced-motion`.
9. Tanpa gamifikasi (poin, lencana, leaderboard).

Jika permintaan bertentangan dengan aturan ini, sampaikan dulu ke pengguna sebelum mengerjakan.

## Format Bank Soal
`data/soal.json` berisi daftar soal. Contoh pilihan ganda (Mudah):
```json
{
  "id": "L1-06",
  "tingkat": "mudah",
  "tipe": "pilihan_ganda",
  "jenis": "berbalik",
  "tp": ["TP4"],
  "teks": "Sebuah pekerjaan dapat diselesaikan 3 pekerja dalam 18 hari. Jika dikerjakan 6 pekerja, berapa hari?",
  "label": { "a": "pekerja", "b": "hari" },
  "nilai": { "a1": 3, "b1": 18, "a2": 6 },
  "ditanya": "b2",
  "kunci": 9,
  "satuan": "hari",
  "opsi": [
    { "nilai": 9 },
    { "nilai": 36, "jenis": "salah_jenis" },
    { "nilai": 54, "jenis": "salah_hitung" },
    { "nilai": 15, "jenis": "lainnya", "pesan": "Hubungannya bukan dikurangi, tetapi hasil kalinya tetap." }
  ],
  "hint": [
    "Jika pekerjanya bertambah, waktunya jadi lebih lama atau lebih cepat?",
    "a₁ = 3, b₁ = 18, a₂ = 6. Hitung 3 × 18 dulu.",
    "Contoh: 4 × 12 = 6 × b₂ → b₂ = 48 ÷ 6 = 8 hari."
  ],
  "pembahasan": "3 × 18 = 6 × b₂ → 54 = 6 b₂ → b₂ = 9 hari. Pekerja bertambah, hari berkurang. Masuk akal."
}
```
Contoh isian (Sulit):
```json
{
  "id": "L3-02",
  "tingkat": "sulit",
  "tipe": "isian",
  "jenis": "berbalik",
  "tp": ["TP3", "TP4", "TP5"],
  "teks": "Pak Budi membeli rumput seharga Rp2.000.000. Rumput itu cukup untuk 150 ekor domba selama 12 hari. Kemudian 30 domba dijual. Berapa hari rumput itu cukup?",
  "label": { "a": "domba (ekor)", "b": "hari" },
  "nilai": { "a1": 150, "b1": 12, "a2": 120 },
  "ditanya": "b2",
  "kunci": 15,
  "satuan": "hari",
  "jawabanSalah": [
    { "nilai": 60, "jenis": "salah_baca", "pesan": "Baca lagi: 30 domba dijual. Berapa domba yang tersisa?" }
  ],
  "hint": ["…", "…", "…"],
  "pembahasan": "…"
}
```
- `jenis: "senilai"` untuk soal pengecoh.
- Mode tandai (Latihan Sulit) memecah teks soal per kalimat/anak kalimat di HP. Syarat lanjut: minimal 2 bagian *Diketahui* dan kalimat bertanda tanya ditandai *Ditanya*. Tidak ada data tandai di bank soal.
- Kuis memakai tipe tambahan `pilihan_teks` (opsi berupa teks, `kunci` = teks benar) dan `jenis` (`kunci` = `senilai`/`berbalik`). Setiap soal kuis punya `tp`.
- `bank_soal.soal_publik()` **harus** membuang `kunci`, `jawabanSalah`, `pembahasan`, `hint`, `nilai`, serta `jenis`/`pesan` di setiap opsi. Opsi dikirim hanya sebagai daftar nilai yang diacak.

## Logika Penilaian (`app/checker.py`)
- Berbalik nilai: `b2 = a1 * b1 / a2` atau `a2 = a1 * b1 / b2`.
- Bandingkan dengan toleransi `abs(jawaban - kunci) < 0.01`.
- Urutan deteksi:
  1. `benar`
  2. cocok dengan `opsi[].jenis` atau `jawabanSalah[]` → pakai jenis & pesannya
  3. sama dengan hasil rumus senilai `b1 * a2 / a1` → `salah_jenis`
  4. `isian_tabel` benar tetapi hasil salah → `salah_hitung`
  5. selain itu → `lainnya`
- Pesan default per jenis kesalahan sesuai tabel di [PRD.md §4](PRD.md#umpan-balik-berdasarkan-jenis-kesalahan-f8).

## PWA
- `manifest.webmanifest`: `name: "BerbalikYuk!"`, `short_name: "BerbalikYuk"`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `theme_color: "#2F6FDE"`, `background_color: "#EEF4FF"`, ikon 192, 512, dan 512 `maskable`.
- `index.html` memuat `<link rel="manifest">`, `<meta name="theme-color">`, `<link rel="apple-touch-icon">`, dan `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- `sw.js` **disajikan dari root** (`/sw.js`) oleh `routes_halaman.py` agar scope-nya mencakup seluruh aplikasi.
- Strategi cache:
  - *Precache* saat `install`: shell (`/`, CSS, JS, ikon, `static/data/*.json`, ilustrasi).
  - Aset statis: *cache-first*.
  - `/api/*`: **network-only, tidak pernah di-cache**.
  - Navigasi saat offline: kembalikan `/` dari cache.
- **Naikkan `CACHE_VERSION` di `sw.js` setiap rilis.** Saat ada SW baru, tampilkan "Versi baru tersedia — ketuk untuk memuat ulang".
- `pwa.js`: simpan event `beforeinstallprompt` untuk tombol *Pasang Aplikasi* (Android). Deteksi iOS (`/iphone|ipad/i`) dan `display-mode: standalone` untuk menampilkan panduan Safari atau status "sudah terpasang".
- PWA hanya bisa dipasang lewat **HTTPS** (atau `localhost`).

## Keamanan
- `SUPABASE_SERVICE_KEY` dan `SECRET_KEY` **hanya** ada di `.env` (lokal) dan variabel lingkungan Vercel. `.env` masuk `.gitignore`. **Jangan pernah** menulis kunci ini di kode, `static/`, atau commit.
- RLS aktif di semua tabel **tanpa policy**, sehingga hanya `service_role` (server) yang bisa mengakses.
- Kata sandi: `generate_password_hash` / `check_password_hash` dari `werkzeug.security`. Jangan pernah menyimpan atau mencatat sandi asli.
- Sesi: cookie Flask bertanda tangan, `SESSION_COOKIE_HTTPONLY=True`, `SESSION_COOKIE_SAMESITE="Lax"`, `SESSION_COOKIE_SECURE=True` di produksi, masa berlaku 30 hari. Simpan hanya `siswa_id` di sesi.
- Endpoint yang mengubah data hanya menerima `Content-Type: application/json` (mengurangi risiko CSRF bersama SameSite=Lax).
- Folder `data/` tidak boleh bisa diakses lewat URL. Uji: `GET /data/soal.json` harus `404`.
- Pesan galat login dibuat umum ("Username atau kata sandi salah") agar username tidak bisa ditebak.

## Menjalankan Lokal
Jika `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` kosong, aplikasi otomatis memakai **SQLite** di `instance/berbalikyuk.db` (cukup untuk pengembangan; pengujian juga memakai SQLite sementara). Di Vercel, Supabase wajib diisi.
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate    |  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                  # lalu isi SUPABASE_URL, SUPABASE_SERVICE_KEY, SECRET_KEY
flask --app run run --debug           # buka http://localhost:5000
pytest                                # jalankan pengujian
```
- Uji tampilan HP: Chrome DevTools → *Device Mode* (360 × 740).
- Uji **instalasi** di HP sungguhan butuh HTTPS: pakai hasil deploy Vercel (*preview*), atau Chrome *Remote Debugging* → *Port forwarding* `localhost:5000`.

## Deploy (Vercel)
1. Hubungkan repo ke Vercel. `vercel.json` mengarahkan semua path ke `api/index.py`.
2. Isi variabel lingkungan: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SECRET_KEY`.
3. Setelah deploy, buka di HP lalu uji *Pasang Aplikasi*.

## Pengujian
- `tests/test_checker.py`: untuk **setiap** soal di `soal.json` dan `kuis.json`, kunci → `benar`; setiap opsi salah/`jawabanSalah` → terdeteksi sesuai jenisnya; hasil rumus senilai → `salah_jenis`.
- `tests/test_api.py` (database SQLite sementara, tanpa mock): daftar/masuk/keluar, `401` tanpa sesi, `/api/latihan/*` tidak memuat `kunci`, tingkat terkunci → `403`, `GET /data/soal.json` → `404`.
- Manual: checklist [DESAIN.md §8](DESAIN.md#8-checklist-desain-per-layar); Lighthouse (kategori PWA *installable*); alur daftar → keluar → masuk lagi → progres masih ada; mode pesawat → Materi tetap terbuka.

## Yang Tidak Boleh Dilakukan
- Menambah framework/bundler frontend atau memanggil Supabase langsung dari JavaScript.
- Mengirim kunci jawaban, pembahasan, atau jenis kesalahan opsi ke klien sebelum siswa menjawab.
- Men-cache respons `/api/*` di service worker.
- Menambah halaman guru atau fitur di luar PRD tanpa persetujuan.
- Mengubah notasi (a, b, 1, 2; rumus a₁ × b₁ = a₂ × b₂) yang sudah ditetapkan.
- Menyimpan data pribadi selain nama panggilan, kelas, dan username.
