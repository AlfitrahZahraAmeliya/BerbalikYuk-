# BerbalikYuk! — Aplikasi Belajar Perbandingan Berbalik Nilai

Aplikasi web untuk membantu siswa SMP mempelajari **Perbandingan Berbalik Nilai**. Aplikasi bisa dibuka di smartphone maupun komputer, dan **bisa dipasang di layar utama HP tanpa Play Store atau App Store** (Progressive Web App). Rancangannya berbasis **Cognitive Load Theory** dan model pengembangan **ADDIE**.

| | |
|---|---|
| **Nama** | Alfitrah Zahra Ameliya |
| **NIM** | 2225250181 |
| **Kelas** | 3B — S1 Pendidikan Matematika |
| **Mata Kuliah** | Algoritma dan Pemrograman |
| **Dosen Pengampu** | Dr. Aan Hendrayana, S.Si., M.Pd. |

---

## Latar Belakang
Wawancara dengan siswa SMP menunjukkan bahwa kesulitan materi ini bukan terutama pada berhitung. Kesulitannya ada pada:
- memahami *mengapa* satu besaran bertambah ketika yang lain berkurang,
- memilah informasi pada soal cerita yang panjang,
- tertukar saat memasukkan angka ke rumus,
- penjelasan yang terlalu cepat dan tampilan yang terlalu ramai.

Aplikasi ini dirancang untuk **mengurangi beban kognitif yang tidak perlu (extraneous)**, **mengelola kerumitan materi secara bertahap (intrinsic)**, dan **mendorong pemahaman yang bermakna (germane)**, sehingga kemampuan **literasi matematika** siswa meningkat.

## Fitur Utama
1. **Masuk dengan username** (tanpa email), sehingga progres belajar tersimpan.
2. **Materi bertahap** dalam 6 subtopik, didahului cek prasyarat perkalian, pembagian, dan pecahan.
3. **Simulasi interaktif**: geser jumlah pekerja dan lihat jumlah hari berubah, sementara hasil kalinya tetap.
4. **Contoh soal langkah demi langkah** dengan kecepatan yang diatur siswa sendiri.
5. **Latihan 3 tingkat**: Mudah (pilihan ganda), Sedang, dan Sulit (isian + tabel + tandai *Diketahui/Ditanya*), dengan petunjuk 3 tingkat dan umpan balik sesuai jenis kesalahan.
6. **Kuis** akhir beserta pembahasan.
7. **Progres belajar** dan pengaturan ukuran huruf.
8. **Bisa dipasang di HP** dan materi tetap bisa dibuka tanpa internet.

## Teknologi
| Bagian | Teknologi |
|---|---|
| Tampilan (frontend) | **JavaScript**, HTML, CSS (tanpa framework) |
| Server (backend) | **Python** — Flask |
| Database | Supabase (PostgreSQL) |
| Instalasi di HP | Progressive Web App (manifest + service worker) |
| Hosting | Vercel |

Penilaian jawaban dilakukan oleh server Python, sehingga kunci jawaban tidak bisa diintip dari HP.

## Cara Memasang di HP (tanpa Play Store / App Store)
**Android (Chrome)**
1. Buka alamat aplikasi di Chrome.
2. Ketuk tombol **Pasang Aplikasi** di Beranda atau Pengaturan. Bisa juga lewat menu **⋮ → Instal aplikasi / Tambahkan ke layar utama**.
3. Ikon **BerbalikYuk!** muncul di layar utama dan bisa dibuka seperti aplikasi biasa.

**iPhone (Safari)**
1. Buka alamat aplikasi di **Safari**.
2. Ketuk tombol **Bagikan** (kotak dengan panah ke atas).
3. Pilih **Tambahkan ke Layar Utama**, lalu **Tambah**.

## Menjalankan di Komputer (untuk pengembang)
Butuh **Python 3.11+**. Akun **Supabase** (gratis) baru diperlukan untuk deploy. Saat pengembangan di komputer, jika Supabase belum diisi, aplikasi otomatis memakai database SQLite lokal.

1. **Siapkan Supabase**
   - Buat proyek baru di [supabase.com](https://supabase.com).
   - Buka **SQL Editor**, jalankan isi file `supabase/schema.sql`.
   - Buka **Project Settings → API**, salin **Project URL** dan **service_role key**.
2. **Siapkan proyek**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate           # Windows (macOS/Linux: source .venv/bin/activate)
   pip install -r requirements.txt
   copy .env.example .env           # Windows (macOS/Linux: cp .env.example .env)
   ```
   Isi `.env` (boleh dikosongkan dulu untuk mencoba dengan SQLite):
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY=...        # rahasia, jangan dibagikan atau di-commit
   SECRET_KEY=...                  # string acak panjang
   ```
3. **Jalankan**
   ```bash
   flask --app run run --debug
   ```
   Buka `http://localhost:5000`.
4. **Uji**
   ```bash
   pytest
   ```

## Deploy ke Vercel
1. Unggah proyek ke GitHub, lalu impor repositorinya di [vercel.com](https://vercel.com).
2. Di **Settings → Environment Variables**, isi `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, dan `SECRET_KEY`.
3. Deploy. Alamat yang didapat (`https://….vercel.app`) sudah HTTPS, sehingga aplikasi bisa dipasang di HP.

## Dokumen Perencanaan
| File | Isi |
|---|---|
| [ANALISIS.md](ANALISIS.md) | Hasil wawancara → temuan beban kognitif → implikasi desain (tahap *Analysis*) |
| [PRD.md](PRD.md) | Kebutuhan produk: fitur, menu, user stories, skema data, rencana rilis |
| [DESAIN.md](DESAIN.md) | Prinsip desain instruksional, tampilan (adaptasi mockup), wireframe, bank soal (tahap *Design*) |
| [CLAUDE.md](CLAUDE.md) | Panduan teknis untuk AI asisten saat menulis kode |

## Status Pengembangan (ADDIE)
- [x] **Analysis**: wawancara siswa S01 dan analisis kebutuhan
- [ ] **Design**: PRD, desain tampilan, dan bank soal (draf v1.1 selesai, menunggu persetujuan)
- [ ] **Development**: pembuatan aplikasi (Python + JavaScript, PWA)
- [ ] **Implementation**: uji coba perorangan dan kelompok kecil, termasuk uji pemasangan di HP siswa
- [ ] **Evaluation**: validasi ahli, angket cognitive load, revisi
