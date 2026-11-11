# PRD.md — Product Requirements Document

**Nama produk:** *BerbalikYuk!* — Aplikasi Belajar Perbandingan Berbalik Nilai
**Penyusun:** Alfitrah Zahra Ameliya (NIM 2225250181)
**Versi dokumen:** 1.1 — 11 November 2026
**Status:** Draf, tahap *Design* (ADDIE)

Dokumen terkait: [ANALISIS.md](ANALISIS.md) · [DESAIN.md](DESAIN.md) · [CLAUDE.md](CLAUDE.md) · [README.md](README.md)

> **Perubahan v1.1:** aplikasi menjadi **PWA** yang bisa dipasang di HP tanpa Play Store/App Store; backend memakai **Python (Flask)**; tampilan mengadaptasi mockup MathStep; rumus utama **a₁ × b₁ = a₂ × b₂**; tambah F10 dan F11.

---

## 1. Latar Belakang

Wawancara dengan siswa SMP (S01) menunjukkan bahwa kesulitan perbandingan berbalik nilai **bukan terutama pada perhitungan**. Kesulitannya ada pada:
- memahami *mengapa* hubungannya terbalik (beban intrinsik),
- memahami soal cerita panjang dan menempatkan angka ke rumus (beban intrinsik + ekstrinsik),
- penyajian yang terpisah, tempo yang cepat, dan tampilan yang ramai (beban ekstrinsik).

Aplikasi ini dirancang dengan prinsip **Cognitive Load Theory** untuk menurunkan beban ekstrinsik, mengelola beban intrinsik secara bertahap, dan mendorong beban germane (pemahaman skema), sehingga **literasi matematika** siswa meningkat.

## 2. Pernyataan Masalah

> Siswa SMP dapat menghafal rumus perbandingan berbalik nilai, tetapi kesulitan menerapkannya pada soal cerita karena belum memahami hubungan antarbesaran, kesulitan memilah informasi, dan sering tertukar menempatkan angka.

## 3. Tujuan & Metrik Keberhasilan

| Tujuan | Metrik | Target awal |
|---|---|---|
| Meningkatkan pemahaman | Rata-rata skor Kuis vs Cek Prasyarat/awal | Naik ≥ 20 poin |
| Mengurangi kesalahan penempatan angka | Persentase jawaban `salah_jenis` dari Mudah → Sulit | Turun dari waktu ke waktu |
| Melatih kemandirian | Rata-rata hint yang dipakai per soal | Turun dari Mudah ke Sulit |
| Keterlibatan | Persentase siswa yang menyelesaikan semua materi | ≥ 70% saat uji coba |
| Mudah diakses | Persentase siswa uji coba yang berhasil memasang aplikasi di HP | ≥ 90% |
| Beban kognitif rendah | Skor angket *cognitive load* (tahap Evaluate) | Beban ekstrinsik dinilai rendah |

## 4. Ruang Lingkup MVP

### Persona
**Rani, 12 tahun, kelas 7.** Belajar lewat HP Android milik orang tua yang memorinya hampir penuh. Bisa mengalikan dan membagi, tetapi mudah bingung dengan soal cerita yang panjang. Lebih suka tampilan sederhana dan contoh dari kehidupan sehari-hari.

### Arsitektur singkat
```
HP / Browser (JavaScript, PWA)  ──HTTPS──>  Flask (Python)  ──>  Supabase (PostgreSQL)
```
- **Frontend (JavaScript):** tampilan, navigasi, simulasi, mode tandai, service worker untuk instalasi dan cache offline.
- **Backend (Python/Flask):** login, menyajikan soal **tanpa kunci jawaban**, menilai jawaban dan mendeteksi jenis kesalahan, menyimpan progres.
- **Database (Supabase):** menyimpan akun siswa, progres, riwayat jawaban, dan hasil kuis. Hanya server yang boleh mengakses.

Rincian teknis ada di [CLAUDE.md](CLAUDE.md).

### Struktur menu (adaptasi mockup)
```
Navigasi bawah:   [ Beranda ]   [ Progres ]   [ Pengaturan ]

Beranda
 ├─ Tombol "Mulai Belajar"  → melanjutkan ke langkah berikutnya yang disarankan
 └─ 4 menu: Materi · Contoh Soal · Latihan · Kuis

Materi (6 subtopik, didahului Cek Prasyarat sekali)
 1. Pengertian Perbandingan Berbalik Nilai
 2. Ciri-ciri Perbandingan Berbalik Nilai
 3. Hubungan Dua Besaran  (simulasi slider)
 4. Tabel Perbandingan
 5. Rumus dan Penerapannya
 6. Perbedaan dengan Perbandingan Senilai
```
Urutan belajar yang disarankan (EL04, DS02): **Materi 1–6 → Contoh Soal → Latihan Mudah → Sedang → Sulit → Kuis**. Tombol *Mulai Belajar* selalu mengarah ke langkah berikutnya. Menu tetap bisa dibuka bebas, kecuali Latihan Sedang dan Sulit yang terbuka bertahap.

### Daftar fitur

| ID | Fitur | Letak di menu | Deskripsi | Dasar (ANALISIS) |
|---|---|---|---|---|
| F1 | **Masuk / Daftar** | Layar awal | Login dikelola Flask: nama panggilan, kelas, username, kata sandi. Tanpa email | Kebutuhan simpan progres |
| F2 | **Beranda** | Beranda | Judul, ilustrasi, tombol *Mulai Belajar*, 4 menu utama | EL04, DS01 |
| F3 | **Cek Prasyarat** | Sebelum Materi 1 | 5 soal singkat (perkalian, pembagian, pecahan). Tidak menghambat; memberi kartu pengingat jika salah | IL03 |
| F4 | **Konsep** | Materi 1, 2, 3 | Pengertian, ciri-ciri, dan **simulasi slider** pekerja ↔ hari dengan tabel "hasil kali tetap". Refleksi singkat di akhir | IL01, K01, GL04 |
| F5 | **Mengenali Jenis** | Materi 2 & 6 | Senilai vs berbalik nilai berdampingan; kuis 8 situasi: pilih *Senilai* / *Berbalik nilai* + alasan | K01, IL01, GL05, EL04 |
| F6 | **Tabel & Rumus** | Materi 4, 5 | Tabel a/b berlabel; latihan ketuk angka ke kotak a₁, b₁, a₂; rumus utama **a₁ × b₁ = a₂ × b₂**, dan kesetaraannya dengan bentuk pecahan di buku | IL02, IL05, EL04, DS02 |
| F7 | **Contoh Soal** | Contoh Soal | 3 contoh dengan langkah bertahap (tombol *Lanjut*) dan layar *Pembahasan Lengkap*. Contoh 2–3 dipudarkan (*fading*) | GL01, GL03, EL02 |
| F8 | **Latihan Bertahap** | Latihan | **Mudah** (pilihan ganda, data langsung) → **Sedang** (isian + tabel, cerita pendek, termasuk soal pengecoh senilai) → **Sulit** (isian + tabel + mode tandai, cerita panjang dengan informasi tambahan). Hint 3 tingkat, umpan balik per jenis kesalahan, langkah cek kewajaran | IL04, IL05, EL01, EL05, GL02, GL03, GL05, DS02 |
| F9 | **Kuis** | Kuis | Evaluasi akhir 6 soal campuran tanpa hint (1 per tujuan pembelajaran TP1–TP5, ditambah soal cerita panjang). Layar hasil: skor, trofi statis, tombol *Lihat Pembahasan* dan *Ulangi Kuis* | Metrik keberhasilan |
| F10 | **Progres & Pengaturan** | Navigasi bawah | Progres: cincin total skor, daftar materi yang sudah dipelajari, skor per tujuan pembelajaran. Pengaturan: ukuran huruf (Normal/Besar), *Pasang Aplikasi*, Keluar | EL03, US2 |
| F11 | **Instalasi PWA & offline** | Beranda (banner), Pengaturan | Aplikasi bisa dipasang di layar utama HP tanpa Play Store/App Store. Materi dan contoh soal tetap bisa dibuka tanpa internet | Konteks penggunaan |

### Aturan buka-kunci latihan
- **Mudah**: selalu terbuka.
- **Sedang**: terbuka setelah skor Mudah ≥ 60%.
- **Sulit**: terbuka setelah skor Sedang ≥ 60%.
- Soal yang salah dikerjakan bisa diulang. Skor yang disimpan adalah skor terbaik.

### Enam langkah penyelesaian standar (dipakai di F7 & F8)
1. **Diketahui**: tandai informasi yang diketahui.
2. **Ditanya**: tandai apa yang ditanyakan.
3. **Tentukan hubungan**: senilai atau berbalik nilai? (Jika satu bertambah, yang lain …?)
4. **Gunakan rumus**: masukkan ke tabel lalu ke a₁ × b₁ = a₂ × b₂.
5. **Hitung**: selesaikan.
6. **Kesimpulan & cek**: tulis kesimpulan dan periksa apakah masuk akal (pekerja bertambah → hari harus berkurang).

### Hint 3 tingkat (F8)
| Tingkat | Isi | Contoh |
|---|---|---|
| 1 – Pertanyaan pemantik | Mengarahkan perhatian | "Jika pekerjanya bertambah, waktunya jadi lebih lama atau lebih cepat?" |
| 2 – Petunjuk langkah | Membantu langkah yang sedang dikerjakan | "a₁ = 3 pekerja, b₁ = 18 hari, a₂ = 6. Hitung 3 × 18 dulu." |
| 3 – Contoh mirip | Menampilkan *worked example* sejenis dengan angka berbeda | "4 pekerja 12 hari → 6 pekerja: 4 × 12 = 6 × b₂ → b₂ = 8 hari." |

### Umpan balik berdasarkan jenis kesalahan (F8)
Penilaian dilakukan **di server (Python)** agar kunci jawaban tidak terlihat di HP.

| Kode | Jenis kesalahan | Cara deteksi | Pesan (ringkas) |
|---|---|---|---|
| `benar` | — | jawaban = kunci | "Tepat! Pekerja bertambah, hari berkurang. Masuk akal." |
| `salah_jenis` | Memakai perbandingan senilai / angka tertukar | jawaban = (b₁ × a₂) : a₁ | "Hasilmu justru makin besar. Coba cek lagi: ini senilai atau berbalik nilai?" |
| `salah_baca` | Salah menentukan a₂ dari kalimat (mis. "30 dijual" dianggap "menjadi 30") | jawaban cocok dengan alternatif salah baca yang tercatat di bank soal | "Baca lagi kalimat '…'. Berapa jumlah akhirnya?" |
| `salah_hitung` | Model benar tetapi aritmetika salah | isian tabel benar, hasil berbeda | "Rumusmu sudah benar. Periksa lagi perkaliannya." |
| `lainnya` | Tidak terdeteksi | — | Tawarkan hint tingkat 1 |

Untuk soal **pilihan ganda** (Mudah), setiap opsi salah sudah diberi jenis kesalahan di bank soal, jadi umpan baliknya langsung tepat sasaran.

> Catatan: pada berbalik nilai, menukar posisi angka menghasilkan nilai yang sama dengan memakai rumus senilai. Karena itu `salah_jenis` dan "salah tempat angka" diberi umpan balik yang sama, yaitu ajakan memeriksa **arah hubungan** (GL02).

## 5. User Stories & Kriteria Penerimaan

| ID | Sebagai siswa, saya ingin… | Kriteria penerimaan |
|---|---|---|
| US1 | mendaftar dan masuk dengan username | Daftar dengan nama, kelas, username (3–20 huruf/angka), sandi (≥ 6 karakter); login membuka Beranda; sesi bertahan 30 hari saat aplikasi dibuka ulang |
| US2 | melihat sampai mana saya belajar | Halaman Progres menampilkan total skor dan materi yang sudah selesai dari server |
| US3 | memahami mengapa hubungannya terbalik | Slider di Materi 3 mengubah jumlah hari secara langsung; tabel menampilkan hasil kali yang selalu sama |
| US4 | bisa membedakan senilai dan berbalik nilai | F5 memberi umpan balik per item; skor tersimpan |
| US5 | tidak tertukar memasukkan angka | Tabel berlabel a₁/b₁/a₂/b₂; nilai di tabel otomatis tampil di kotak rumus pada layar yang sama |
| US6 | belajar dari contoh dengan kecepatan saya sendiri | Contoh Soal: setiap langkah muncul hanya setelah tombol **Lanjut**; ada tombol kembali ke langkah sebelumnya |
| US7 | dibantu ketika macet tanpa langsung diberi jawaban | Tombol **Petunjuk** membuka hint berurutan 1→2→3; jumlah hint tercatat |
| US8 | tahu letak kesalahan saya | Umpan balik menampilkan jenis kesalahan sesuai tabel di atas |
| US9 | melatih soal cerita panjang | Latihan Sulit: jawaban hanya bisa dikirim setelah *Diketahui* dan *Ditanya* ditandai |
| US10 | melihat hasil kuis | Layar hasil menampilkan skor, skor per TP, dan pembahasan setiap soal |
| US11 | memasang aplikasi di HP tanpa Play Store | Android: tombol *Pasang Aplikasi* memunculkan dialog instalasi Chrome. iPhone: tampil panduan Safari → Bagikan → *Tambahkan ke Layar Utama*. Setelah dipasang, aplikasi terbuka layar penuh tanpa bilah alamat |
| US12 | membuka materi saat tidak ada sinyal | Materi 1–6 dan Contoh Soal yang pernah dibuka tetap tampil saat offline; menu Latihan/Kuis menampilkan pesan "Butuh internet" yang sopan |

## 6. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| Responsif | *Mobile-first*, nyaman di lebar 360 px, tetap rapi di desktop (konten maks. 480 px di tengah, seperti tampilan HP) |
| Instalasi | Memenuhi kriteria *installable* PWA (manifest, service worker, HTTPS, ikon 192 & 512 px); diuji di Chrome Android dan Safari iOS |
| Offline | Aset aplikasi, Materi, dan Contoh Soal di-cache. `/api/*` tidak pernah di-cache |
| Kinerja | Muat awal < 3 detik di jaringan 4G; total aset awal < 1 MB; tanpa framework frontend |
| Aksesibilitas | Kontras ≥ 4.5:1, target sentuh ≥ 44 px, font dasar ≥ 16 px (opsi Besar 18 px), label pada setiap input, mendukung `prefers-reduced-motion` |
| Browser | Chrome Android & Safari iOS (2 versi terakhir), Chrome/Edge/Firefox desktop |
| Bahasa | Bahasa Indonesia baku yang ramah siswa, kalimat pendek |
| Keamanan | Kata sandi di-hash; kunci jawaban hanya di server; `service_role` key hanya di variabel lingkungan server; RLS aktif |
| Privasi | Data minimum: nama panggilan, kelas, username. Tanpa email atau nomor HP siswa |

## 7. Model Data (Supabase / PostgreSQL)

```sql
create table public.siswa (
  id             uuid primary key default gen_random_uuid(),
  username       text unique not null,          -- huruf kecil, 3–20 karakter
  nama           text not null,
  kelas          text not null,
  password_hash  text not null,                 -- werkzeug.security.generate_password_hash
  created_at     timestamptz default now()
);

create table public.progress (
  siswa_id      uuid references public.siswa(id) on delete cascade,
  modul_id      text not null,   -- 'prasyarat','materi-1'…'materi-6','contoh','latihan-mudah','latihan-sedang','latihan-sulit'
  selesai       boolean default false,
  skor          int,             -- 0–100, skor terbaik
  hint_dipakai  int default 0,
  updated_at    timestamptz default now(),
  primary key (siswa_id, modul_id)
);

create table public.attempts (
  id               bigint generated always as identity primary key,
  siswa_id         uuid references public.siswa(id) on delete cascade,
  modul_id         text not null,
  soal_id          text not null,
  jawaban          text,          -- angka atau huruf opsi
  benar            boolean not null,
  jenis_kesalahan  text,          -- 'benar','salah_jenis','salah_baca','salah_hitung','lainnya'
  hint_level       int default 0,
  durasi_detik     int,
  created_at       timestamptz default now()
);

create table public.kuis_hasil (
  id           bigint generated always as identity primary key,
  siswa_id     uuid references public.siswa(id) on delete cascade,
  skor         int not null,
  skor_per_tp  jsonb,             -- {"TP1": 100, "TP2": 50, ...}
  created_at   timestamptz default now()
);

-- RLS aktif tanpa policy: hanya server (service_role) yang bisa mengakses
alter table public.siswa      enable row level security;
alter table public.progress   enable row level security;
alter table public.attempts   enable row level security;
alter table public.kuis_hasil enable row level security;
```

## 8. Di Luar Lingkup (versi ini)

- Halaman/akun guru, rekap kelas, ekspor nilai
- Leaderboard, poin, lencana, confetti, dan elemen gamifikasi lain (berisiko menambah beban ekstrinsik)
- Mengerjakan Latihan/Kuis saat offline
- Publikasi di Play Store / App Store
- Reset kata sandi lewat email
- Materi perbandingan senilai secara penuh (hanya sebagai pembanding di F5)
- Suara/narasi audio

## 9. Rencana Rilis (ADDIE)

| Tahap | Keluaran | Status |
|---|---|---|
| **Analysis** | ANALISIS.md (wawancara S01) | ✅ Selesai |
| **Design** | PRD.md, DESAIN.md, CLAUDE.md, bank soal | 🔄 Sedang berjalan |
| **Development** | v0.1: kerangka Flask + PWA (bisa dipasang) + F1–F2 + skema Supabase → v0.2: F3–F6 (Materi) → v0.3: F7–F8 → v1.0: F9–F11 + perbaikan | ⏳ |
| **Implementation** | Uji coba perorangan (1–3 siswa), lalu kelompok kecil (6–9 siswa), termasuk uji pemasangan di HP siswa | ⏳ |
| **Evaluation** | Validasi ahli materi & media, angket *cognitive load*, perbandingan skor awal–akhir, revisi | ⏳ |

## 10. Risiko

| Risiko | Mitigasi |
|---|---|
| Siswa lupa sandi | Siswa membuat akun baru (tanpa reset via email pada versi ini) |
| Browser HP lama tidak mendukung instalasi PWA | Aplikasi tetap bisa dipakai langsung dari browser; panduan instalasi per browser |
| iPhone tidak menampilkan dialog instalasi otomatis | Panduan bergambar "Tambahkan ke Layar Utama" di Pengaturan |
| Siswa melihat versi lama setelah pembaruan (cache) | `CACHE_VERSION` dinaikkan setiap rilis; muncul pesan "Versi baru tersedia, ketuk untuk memuat ulang" |
| Kuota gratis Supabase / proyek di-*pause* karena tidak aktif | Buka dasbor rutin saat uji coba; cadangkan data sebelum uji coba |
| Validitas temuan (1 responden) | Konfirmasi lewat uji coba kelompok kecil |
| Deteksi jenis kesalahan keliru | Bank soal menyimpan alternatif jawaban salah secara eksplisit; pesan umpan balik tidak menyalahkan |
