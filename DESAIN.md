# DESAIN.md — Desain Instruksional & UI/UX

Dokumen terkait: [ANALISIS.md](ANALISIS.md) · [PRD.md](PRD.md) · [CLAUDE.md](CLAUDE.md)

Satu kalimat panduan seluruh desain:
> **Tampilkan hanya yang dibutuhkan siswa untuk langkah ini, di satu tempat, dengan kecepatan yang ia pilih sendiri.**

**Acuan visual:** mockup *MathStep* (8 layar) yang diadaptasi. Yang diambil: tata letak, warna biru lembut, kartu putih membulat, navigasi bawah, menu Materi/Contoh Soal/Latihan/Kuis, langkah bernomor, dan kotak rumus kuning. Yang **disesuaikan** agar sesuai temuan wawancara (EL03, DS03): ilustrasi dibatasi, **tanpa confetti**, dan latihan tidak semuanya pilihan ganda.

---

## 1. Prinsip Cognitive Load yang Diterapkan

| Prinsip | Arti | Penerapan di aplikasi | Dasar |
|---|---|---|---|
| **Segmentasi** | Materi dipecah menjadi bagian kecil | 6 subtopik Materi; satu konsep per layar | DS03, EL04 |
| **Pacing oleh siswa** | Siswa yang mengatur kecepatan | Tombol **Lanjut** dan kembali; tidak ada auto-play | EL04 |
| **Kontiguitas spasial** | Informasi yang saling terkait diletakkan berdekatan | Kartu soal menempel di atas (*sticky*); tabel & rumus di bawahnya pada layar yang sama | EL02 |
| **Signaling** | Menandai informasi penting | Sorotan *Diketahui* (biru) & *Ditanya* (kuning); label a₁/b₁ di atas angka; kotak rumus kuning | EL05, IL02 |
| **Koherensi** | Membuang yang tidak relevan | Ilustrasi hanya di Beranda & kartu pembuka; tanpa confetti, latar bermotif, atau animasi dekoratif | EL03, DS03 |
| **Worked example → fading** | Contoh lengkap lalu bantuan dikurangi bertahap | Contoh 1 lengkap; Contoh 2 siswa mengisi langkah 5–6; Contoh 3 mengisi langkah 4–6 | GL03 |
| **Pra-latihan** | Mengenalkan istilah sebelum soal kompleks | Materi 1–6 sebelum soal cerita | IL01, IL02 |
| **Kompleksitas bertahap** | Elemen interaktif ditambah sedikit demi sedikit | Latihan Mudah (pilihan ganda) → Sedang (isian) → Sulit (isian + tandai) | IL04, DS02 |
| **Self-explanation** | Siswa menjelaskan alasannya | Pertanyaan "Mengapa?" & langkah cek kewajaran | GL02, GL04 |

---

## 2. Design Tokens

### Warna (diadaptasi dari mockup, palet terbatas)
| Token | Nilai | Penggunaan |
|---|---|---|
| `--warna-utama` | `#2F6FDE` | Tombol utama, ikon aktif navigasi, lingkaran nomor langkah, judul kartu |
| `--warna-utama-tua` | `#1F4FA8` | Teks judul aplikasi, tombol saat ditekan |
| `--warna-utama-muda` | `#DCE8FC` | Kartu header materi, label "Soal:"/"Pembahasan:", sorotan *Diketahui* |
| `--latar` | `#EEF4FF` | Latar halaman (biru sangat muda) |
| `--latar-kartu` | `#FFFFFF` | Kartu, daftar menu, opsi jawaban |
| `--warna-rumus` | `#FFF4CC` (garis `#F2C94C`) | Kotak rumus & kotak kesimpulan; sorotan *Ditanya* |
| `--warna-benar` | `#1E8E3E` | Centang benar, materi selesai |
| `--warna-salah` | `#D9480F` | Umpan balik salah (oranye agar tidak terasa menghukum) |
| `--teks` | `#1F2933` | Teks utama |
| `--teks-lemah` | `#5F6B7A` | Teks pendukung, label navigasi tidak aktif |
| `--garis` | `#D9DEE5` | Garis tabel, batas opsi |
| `--nonaktif` | `#C9D3E3` | Tombol nonaktif (mis. *Cek Jawaban* sebelum opsi dipilih) |

Aturan: **maksimal 3 warna bermakna dalam satu layar** (selain teks/latar). Warna tidak boleh menjadi satu-satunya penanda; selalu disertai ikon atau teks (✓ Benar / ! Coba lagi).

### Tipografi
- Font: **Nunito** (Google Fonts), cadangan `system-ui, sans-serif`.
- Ukuran: dasar 16 px · soal 18 px · judul layar 18 px tebal · judul kartu 20 px tebal · angka di rumus 20 px.
- Opsi **Huruf Besar** di Pengaturan menaikkan semua ukuran +2 px.
- Tinggi baris 1.5; paragraf maks. 3–4 baris di HP.
- Subskrip konsisten: a₁, b₁, a₂, b₂ (Unicode atau `<sub>`).

### Bentuk & spasi
- Radius: kartu 16 px, tombol utama 999 px (*pill*, seperti mockup), opsi jawaban 12 px.
- Bayangan kartu halus: `0 2px 8px rgba(47,111,222,.08)`.
- Skala spasi: 4 · 8 · 12 · 16 · 24 · 32 px. Margin samping halaman 16 px.
- Tinggi tombol minimal 48 px; jarak antartombol ≥ 8 px.
- Lebar konten maks. 480 px di tengah layar pada desktop.
- Ikon: set ikon garis sederhana (inline SVG), satu warna.

### Gerak
- Hanya transisi bermakna: nilai di simulasi berubah halus (150 ms), langkah baru muncul dengan *fade* (200 ms), pindah halaman tanpa animasi geser.
- **Tanpa confetti**, animasi berulang, atau berkedip.
- `@media (prefers-reduced-motion: reduce)` → semua transisi dimatikan.

---

## 3. Aturan Ilustrasi

| Boleh | Tidak boleh |
|---|---|
| 1 ilustrasi karakter siswa di Beranda | Ilustrasi di layar soal, latihan, atau kuis |
| 1 ilustrasi kecil di kartu pembuka Materi/Konsep, **relevan dengan isi** (pekerja berhelm, jam) | Hiasan bintang/percikan yang tidak bermakna |
| Ilustrasi jumlah pekerja di simulasi (ikon 👷 sebanyak nilai slider), karena bagian dari konsep | Maskot yang muncul berulang di setiap layar |
| Trofi **statis** di layar hasil Kuis | Confetti, animasi trofi, suara |

Aset: SVG sederhana bergaya datar dengan palet di atas, disimpan di `static/img/`. Pengguna boleh mengganti dengan gambar sendiri (WebP, < 60 KB per gambar).

---

## 4. Aturan Konten

1. **Maksimal ±40 kata per layar** (di luar teks soal). Soal Latihan Sulit boleh lebih panjang karena itulah yang dilatih.
2. **Satu konsep per layar.**
3. Kalimat pendek (≤ 15 kata), kalimat aktif, memakai "kamu".
4. **Istilah konsisten di seluruh aplikasi:**
   - besaran pertama = **a** (mis. jumlah pekerja), besaran kedua = **b** (mis. jumlah hari)
   - keadaan awal = **1**, keadaan baru = **2**
   - **Rumus utama: a₁ × b₁ = a₂ × b₂.** Bentuk a₁/a₂ = b₂/b₁ hanya di Materi 5 sebagai "bentuk di buku catatanmu".
5. Satuan selalu ditulis (6 *pekerja*, 12 *hari*).
6. Pesan salah tidak menyalahkan: "Belum tepat, ayo cek lagi" (bukan "Salah!").
7. Pesan hasil kuis menyemangati tanpa berlebihan: "Hebat! Kamu sudah memahami materi dengan baik!" (≥ 80), "Bagus! Ulangi bagian … agar lebih mantap." (< 80).

---

## 5. Wireframe Layar

Semua wireframe untuk lebar HP (±360 px). Navigasi bawah tampil di Beranda, Progres, dan Pengaturan; layar belajar memakai tombol ← kembali di kiri atas.

### 5.1 Masuk / Daftar (F1)
```
┌──────────────────────────────┐
│      🎓 BerbalikYuk!         │
│  Belajar perbandingan        │
│  berbalik nilai, pelan-pelan │
│                              │
│  Username                    │
│  [________________________]  │
│  Kata sandi                  │
│  [________________________]  │
│                              │
│  (        Masuk         )    │
│  Belum punya akun? Daftar    │
└──────────────────────────────┘
```
Layar Daftar menambahkan **Nama panggilan** dan **Kelas**.

### 5.2 Beranda (F2) — mockup layar 1
```
┌──────────────────────────────┐
│ 🎓 BerbalikYuk!              │
│ Belajar Perbandingan     [ilustrasi
│ Berbalik Nilai            siswa]
│ Jadi Lebih Mudah!            │
│                              │
│   ( ▶  Mulai Belajar   )     │  ← lanjut ke langkah yang disarankan
│                              │
│ ┌─────┐┌─────┐┌─────┐┌─────┐ │
│ │ 📖  ││ 💡  ││ 🏋  ││ 🏆  │ │
│ │Materi││Contoh││Latihan││Kuis│ │
│ └─────┘└─────┘└─────┘└─────┘ │
│ ┌ 📲 Pasang aplikasi di HP ✕┐│  ← banner F11, hanya jika belum dipasang
├──────────────────────────────┤
│  🏠 Beranda  📊 Progres  ⚙ Pengaturan │
└──────────────────────────────┘
```

### 5.3 Daftar Materi — mockup layar 2
```
┌──────────────────────────────┐
│ ←          Materi         🏠 │
│ ┌──────────────────────────┐ │
│ │ Perbandingan    [ilustrasi│ │
│ │ Berbalik Nilai   pekerja+ │ │
│ │ Mari pahami      jam]     │ │
│ │ konsepnya bertahap!       │ │
│ └──────────────────────────┘ │
│ ✓ Cek Prasyarat            › │
│ (1) Pengertian …           › │
│ (2) Ciri-Ciri …            › │
│ (3) Hubungan Dua Besaran   › │
│ (4) Tabel Perbandingan     › │
│ (5) Rumus dan Penerapannya › │
│ (6) Perbedaan dengan       › │
│     Perbandingan Senilai     │
└──────────────────────────────┘
```
Nomor yang sudah selesai berubah menjadi ✓ hijau. Materi berikutnya yang disarankan diberi garis biru tipis.

### 5.4 Konsep Dasar (Materi 1–2) — mockup layar 3
```
┌──────────────────────────────┐
│ ←       Konsep Dasar   1/3   │
│ ┌──────────────────────────┐ │
│ │ Apa itu Perbandingan     │ │
│ │ Berbalik Nilai?          │ │
│ └──────────────────────────┘ │
│ Hubungan dua besaran: jika   │
│ satu bertambah, yang lain    │
│ berkurang.                   │
│ ┌ Contoh: ─────── [👷👷👷] ┐ │
│ │ Semakin banyak pekerja,  │ │
│ │ waktu semakin sedikit.   │ │
│ └──────────────────────────┘ │
│              ( Lanjut → )    │
└──────────────────────────────┘
```
Layar "Ciri-ciri" berisi daftar centang (Satu besaran naik, yang lain turun · Hasil kalinya tetap · Rumus) dan kotak rumus kuning **a₁ × b₁ = a₂ × b₂**. Satu layar = satu ide; mockup layar 3 dipecah menjadi 2–3 layar agar ≤ 40 kata.

### 5.5 Simulasi Hubungan Dua Besaran (Materi 3 — jawaban untuk IL01)
```
┌──────────────────────────────┐
│ ←  Hubungan Dua Besaran 2/4  │
│ Geser untuk mengubah jumlah  │
│ pekerja.                     │
│ Pekerja  ●───────○───   6    │
│  👷👷👷👷👷👷                     │
│  Waktu selesai: 12 hari      │
│ ┌────────┬───────┬────────┐  │
│ │Pekerja │ Hari  │ P × H  │  │
│ │   3    │  24   │   72   │  │
│ │   6    │  12   │   72   │  │
│ │   9    │   8   │   72   │  │
│ └────────┴───────┴────────┘  │
│ 💡 Hasil kalinya selalu 72.  │
│              ( Lanjut → )    │
└──────────────────────────────┘
```
- Nilai slider dibatasi pada faktor 72 (1, 2, 3, 4, 6, 8, 9, 12, 18, 24) agar hasilnya bilangan bulat.
- Kolom **P × H** baru muncul setelah siswa mencoba ≥ 3 nilai, lalu ditanya: "Apa yang kamu perhatikan?"

### 5.6 Tabel & Rumus (Materi 4–5)
```
┌──────────────────────────────┐
│ ←  Rumus & Penerapannya 3/5  │
│ Ketuk angka, lalu ketuk      │
│ kotaknya.                    │
│ Angka:  ( 4 )  ( 12 )  ( 6 ) │
│          Pekerja (a)  Hari (b)│
│ Awal (1)   [ a₁ ]     [ b₁ ] │
│ Baru (2)   [ a₂ ]     [b₂=?] │
│ ┌──────────────────────────┐ │
│ │  a₁ × b₁  =  a₂ × b₂     │ │  ← kotak rumus kuning, terisi otomatis
│ │   4 × 12  =   6 × b₂     │ │
│ └──────────────────────────┘ │
│              ( Periksa )     │
└──────────────────────────────┘
```
Layar terakhir Materi 5: "Di buku catatanmu, rumusnya ditulis a₁/a₂ = b₂/b₁. Keduanya sama! Kalikan silang: a₁ × b₁ = a₂ × b₂."

### 5.7 Perbedaan dengan Senilai (Materi 6)
Dua kartu bertumpuk dalam satu layar: **Senilai** (keduanya naik; hasil bagi tetap; contoh harga buku) dan **Berbalik nilai** (satu naik, satu turun; hasil kali tetap; contoh pekerja). Dilanjutkan kuis 8 situasi:
```
│ "Semakin banyak buku dibeli, │
│  semakin besar harganya."    │
│ (  Senilai  ) (Berbalik nilai)│
│ ✓ Benar! Keduanya sama-sama  │
│   bertambah → senilai.       │
```

### 5.8 Contoh Soal (F7) — mockup layar 4
```
┌──────────────────────────────┐
│ ←        Contoh Soal   1/3   │
│ ┌ Soal: ───────────────────┐ │  ← kartu soal menempel di atas
│ │ Suatu pekerjaan dapat    │ │
│ │ diselesaikan 4 pekerja   │ │
│ │ dalam 12 hari. Jika      │ │
│ │ dikerjakan 6 pekerja,    │ │
│ │ berapa hari?             │ │
│ └──────────────────────────┘ │
│ [Pembahasan:]                │
│ (1) Diketahui:               │
│     4 pekerja = 12 hari      │
│     6 pekerja = ?            │
│ (2) Ditanya: waktu 6 pekerja │
│ (3) Tentukan hubungan:       │
│     pekerja ↑ → waktu ↓      │
│     (berbalik nilai)         │
│ (4) Gunakan rumus  ░░░░░     │  ← langkah berikutnya belum tampil
│        ( Lanjut → )          │
└──────────────────────────────┘
```
Setiap tekan **Lanjut** membuka satu langkah. Pada Contoh 2–3, langkah yang dipudarkan berubah menjadi isian yang harus diisi siswa.

### 5.9 Pembahasan Lengkap — mockup layar 5
```
┌──────────────────────────────┐
│ ←    Pembahasan Lengkap      │
│ (4) Gunakan Rumus:           │
│   ┌────────────────────┐     │
│   │ a₁ × b₁ = a₂ × b₂  │     │
│   └────────────────────┘     │
│     4 × 12 = 6 × b₂          │
│         48 = 6 b₂            │
│         b₂ = 48 ÷ 6 = 8      │
│ (5) Kesimpulan:              │
│ ┌──────────────────────── ✓┐ │
│ │ Jadi, waktu yang         │ │
│ │ diperlukan 6 pekerja     │ │
│ │ adalah 8 hari.           │ │
│ └──────────────────────────┘ │
│ (6) Masuk akal? Pekerja      │
│     bertambah, hari berkurang│
│     (12 → 8). ✓              │
│          ( Selesai )         │
└──────────────────────────────┘
```
Langkah **(6) cek kewajaran** ditambahkan dari mockup (GL02).

### 5.10 Latihan (F8) — mockup layar 6
**Mudah (pilihan ganda):**
```
┌──────────────────────────────┐
│ ←     Latihan Soal  [Mudah ▾]│
│ ┌──────────────────────────┐ │
│ │ Sebuah pekerjaan dapat   │ │
│ │ diselesaikan 3 pekerja   │ │
│ │ dalam 18 hari. Jika      │ │
│ │ dikerjakan 6 pekerja,    │ │
│ │ berapa hari?             │ │
│ └──────────────────────────┘ │
│ (A) 6 hari                   │
│ (B) 9 hari                   │
│ (C) 12 hari                  │
│ (D) 36 hari                  │
│ ━━━━━━━━░░░░  3/6            │
│ (💡 Petunjuk) (Cek Jawaban)  │  ← Cek Jawaban abu-abu sampai opsi dipilih
└──────────────────────────────┘
```
**Sedang & Sulit (isian):** pilihan A–D diganti tabel a/b, kotak rumus, dan isian jawaban. Pada **Sulit**, siswa menandai *Diketahui*/*Ditanya* pada teks soal dulu; tabel baru aktif setelah itu.
```
│ Tandai: (Diketahui) (Ditanya)│
│          a          b        │
│ (1)   [ 30 ]     [ 30 ]      │
│ (2)   [ 20 ]     [  ? ]      │
│ ┌ a₁ × b₁ = a₂ × b₂ ───────┐ │
│ │ 30 × 30 = 20 × b₂        │ │
│ └──────────────────────────┘ │
│ Jawaban: [_____] hari        │
```
Pemilih tingkat **[Mudah ▾]** menampilkan gembok 🔒 pada Sedang/Sulit yang belum terbuka.

### 5.11 Umpan Balik (F8)
Panel muncul di bawah soal, **di layar yang sama** (bukan pop-up yang menutupi soal).
```
 Benar                               Belum tepat
┌──────────────────────────┐        ┌──────────────────────────┐
│ ✓ Tepat! 9 hari.         │        │ ! Hasilmu 36 hari, makin │
│ Pekerja bertambah →      │        │ lama padahal pekerjanya  │
│ waktu berkurang.         │        │ bertambah. Cek lagi:     │
│ ( Soal berikutnya → )    │        │ senilai atau berbalik?   │
└──────────────────────────┘        │ (💡 Petunjuk)(Coba lagi) │
                                    └──────────────────────────┘
```

### 5.12 Hasil Kuis (F9) — mockup layar 7, tanpa confetti
```
┌──────────────────────────────┐
│          [trofi statis]      │
│        Kuis Selesai!         │
│         Skor Kamu            │
│          80 / 100            │
│ Hebat! Kamu sudah memahami   │
│ materi dengan baik!          │
│                              │
│ (    Lihat Pembahasan    )   │  ← tombol garis
│ (       Ulangi Kuis      )   │  ← tombol penuh
│        Kembali ke Beranda    │
└──────────────────────────────┘
```

### 5.13 Progres (F10) — mockup layar 8
```
┌──────────────────────────────┐
│ ←      Progres Belajar       │
│ ┌──────────────────────────┐ │
│ │ 📊 Total Skor      ◯     │ │  ← cincin progres
│ │    85%                   │ │
│ └──────────────────────────┘ │
│ Materi yang Sudah Dipelajari │
│ ✓ Pengertian                 │
│ ✓ Ciri-Ciri                  │
│ ✓ Rumus                      │
│ ○ Contoh Soal                │
│ Kemampuan                    │
│ Konsep        ████ ✓         │
│ Membaca soal  ██░░           │
│ Cek kewajaran ███░           │
│ ┌ ⭐ Kamu sudah hebat!      ┐ │
│ │    Terus belajar ya!     │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│  🏠 Beranda  📊 Progres  ⚙ Pengaturan │
└──────────────────────────────┘
```
"Total Skor" = rata-rata skor terbaik semua modul yang sudah dikerjakan.

### 5.14 Pengaturan (F10, F11)
```
┌──────────────────────────────┐
│         Pengaturan           │
│ Rani · Kelas 7A              │
│ Ukuran huruf  (Normal)(Besar)│
│ 📲 Pasang Aplikasi        ›  │
│ ℹ  Tentang BerbalikYuk!   ›  │
│ (         Keluar          )  │
├──────────────────────────────┤
│  🏠 Beranda  📊 Progres  ⚙ Pengaturan │
└──────────────────────────────┘
```
**Pasang Aplikasi:**
- Android/Chrome → memanggil dialog instalasi bawaan Chrome.
- iPhone/Safari → menampilkan 3 langkah bergambar: ketuk **Bagikan** (□↑) → **Tambahkan ke Layar Utama** → **Tambah**.
- Jika sudah terpasang (mode `standalone`) → tampil "✓ Aplikasi sudah terpasang".

---

## 6. Komponen UI

| Komponen | Keterangan |
|---|---|
| `nav-bawah` | 3 ikon + label; item aktif berwarna biru |
| `kartu-header` | Kartu biru muda dengan judul + ilustrasi kecil (hanya pembuka materi) |
| `item-menu` | Baris putih: lingkaran nomor/✓, judul, panah › |
| `kartu-soal` | Label "Soal:", teks soal; *sticky* di layar contoh/latihan |
| `langkah` | Lingkaran nomor biru + judul tebal + isi; status tersembunyi / aktif / selesai |
| `kotak-rumus` | Latar kuning muda, rumus a₁ × b₁ = a₂ × b₂, terisi otomatis dari tabel |
| `tabel-perbandingan` | Tabel 2×2 berlabel a/b dan 1/2; sel bisa berupa input |
| `opsi-jawaban` | Baris dengan lingkaran huruf A–D; terpilih = garis biru tebal |
| `penanda-teks` | Bagian soal yang bisa diketuk lalu diberi label Diketahui/Ditanya |
| `tombol-petunjuk` | Tombol garis berikon 💡, "Petunjuk n/3" |
| `panel-umpan-balik` | Muncul di bawah, warna benar/salah + ikon + teks |
| `cincin-skor` | Lingkaran progres SVG |
| `banner-pasang` | Ajakan memasang aplikasi; bisa ditutup dan tidak muncul lagi selama 7 hari |

---

## 7. Bank Soal Awal

Format data per soal ada di [CLAUDE.md](CLAUDE.md#format-bank-soal). Kunci dan opsi salah **hanya disimpan di server**.

Keterangan jenis opsi salah:
- `salah_jenis` = memakai rumus senilai, (b₁ × a₂) : a₁
- `salah_hitung` = lupa membagi (hanya a₁ × b₁)
- `lainnya` = penalaran tambah/kurang (mis. "pekerja bertambah 3, maka hari berkurang 3"), dengan pesan khusus: "Hubungannya bukan ditambah atau dikurangi, tetapi **hasil kalinya tetap**."

### Latihan Mudah — pilihan ganda, data langsung
| ID | Soal | Kunci | Opsi salah |
|---|---|---|---|
| L1-01 | 4 pekerja menyelesaikan pekerjaan dalam 15 hari. Berapa hari jika dikerjakan 6 pekerja? | 10 | 22,5 (`salah_jenis`) · 60 (`salah_hitung`) · 13 (`lainnya`) |
| L1-02 | Dengan kecepatan 60 km/jam, perjalanan ditempuh 3 jam. Berapa jam jika kecepatannya 90 km/jam? | 2 | 4,5 (`salah_jenis`) · 180 (`salah_hitung`) · 3 (`lainnya`) |
| L1-03 | 8 keran mengisi kolam dalam 6 jam. Berapa jam jika memakai 12 keran? | 4 | 9 (`salah_jenis`) · 48 (`salah_hitung`) · 2 (`lainnya`) |
| L1-04 | Pakan cukup untuk 20 ekor ayam selama 30 hari. Berapa hari jika ayamnya 40 ekor? | 15 | 60 (`salah_jenis`) · 600 (`salah_hitung`) · 10 (`lainnya`) |
| L1-05 | 5 mesin menyelesaikan pesanan dalam 12 jam. Berapa jam jika hanya 3 mesin? | 20 | 7,2 (`salah_jenis`) · 60 (`salah_hitung`) · 14 (`lainnya`) |
| L1-06 | Sebuah pekerjaan dapat diselesaikan 3 pekerja dalam 18 hari. Jika dikerjakan 6 pekerja, berapa hari? *(dari mockup)* | 9 | 36 (`salah_jenis`) · 54 (`salah_hitung`) · 15 (`lainnya`) |

Urutan opsi A–D diacak setiap kali soal ditampilkan.

### Latihan Sedang — isian, cerita pendek
| ID | Soal | Kunci | Catatan |
|---|---|---|---|
| L2-01 | Sebuah rumah dibangun 12 tukang dalam 20 hari. Agar selesai dalam 15 hari, berapa tukang yang dibutuhkan? | 16 tukang | Yang ditanya **a₂**, bukan b₂ |
| L2-02 | Beras Bu Sari cukup untuk 6 orang selama 10 hari. Lalu 4 tamu datang menginap. Berapa hari beras itu cukup? | 6 hari | `salah_baca`: a₂ = 4 → 15 hari |
| L2-03 | Dengan kecepatan 50 km/jam, Ayah tiba dalam 4 jam. Agar tiba dalam 2,5 jam, berapa kecepatannya? | 80 km/jam | Melibatkan desimal (IL03) |
| L2-04 | Kursi aula disusun 15 baris, tiap baris 24 kursi. Jika tiap baris 18 kursi, berapa baris? | 20 baris | Konteks baru (GL05) |
| L2-05 | Harga 3 buku tulis Rp12.000. Berapa harga 5 buku? | Rp20.000 | **Soal pengecoh: senilai.** Langkah "Tentukan hubungan" harus dijawab *Senilai* |

### Latihan Sulit — isian + tandai, cerita panjang dengan informasi tambahan
| ID | Soal | Kunci | Pengecoh / jebakan |
|---|---|---|---|
| L3-01 | Proyek jalan desa dikerjakan 30 orang dan direncanakan selesai dalam 40 hari. Setelah 10 hari bekerja, 10 orang dipindahkan ke proyek lain. Berapa hari lagi sisa pekerjaan selesai? | 45 hari | Sisa = 30 hari; a₂ = 20 (`salah_baca`: memakai 40 hari → 60) |
| L3-02 | Pak Budi membeli rumput seharga Rp2.000.000. Rumput itu cukup untuk 150 ekor domba selama 12 hari. Kemudian 30 domba dijual. Berapa hari rumput itu cukup? | 15 hari | Harga tidak dipakai; a₂ = 120 (`salah_baca`: a₂ = 30 → 60) |
| L3-03 | Asrama berisi 40 siswa dengan persediaan beras untuk 18 hari. Setelah 6 hari, 8 siswa pulang kampung. Berapa hari sisa beras akan habis? | 15 hari | Sisa = 12 hari; a₂ = 32 |
| L3-04 | Kontraktor merencanakan gedung selesai 60 hari dengan 25 pekerja. Upah tiap pekerja Rp150.000 per hari. Agar selesai dalam 50 hari, berapa **tambahan** pekerja yang dibutuhkan? | 5 pekerja | Upah tidak dipakai; hasil hitung 30, lalu dikurangi 25 (`salah_baca`: menjawab 30) |
| L3-05 | Rina berangkat sekolah pukul 06.30 naik sepeda dengan kecepatan 12 km/jam dan tiba dalam 30 menit. Jika diantar motor dengan kecepatan 36 km/jam, berapa menit perjalanannya? | 10 menit | Jam berangkat tidak dipakai |

### Contoh Soal (F7)
1. **Lengkap** *(dari mockup)*: 4 pekerja → 12 hari; 6 pekerja → ? 4 × 12 = 6 × b₂ → **8 hari**.
2. **Fading sebagian:** pakan 150 domba → 12 hari; menjadi 100 domba → ? (**18 hari**). Siswa mengisi langkah 5–6.
3. **Fading lebih banyak:** 10 keran → 9 jam; 15 keran → ? (**6 jam**). Siswa mengisi langkah 4–6.

### Kuis (F9)
Enam soal baru dengan konteks yang belum pernah muncul, tanpa hint, disimpan di `data/kuis.json`: K-01 konsep hasil kali tetap (TP1), K-02 jenis perbandingan (TP2), K-03 penjahit, pilihan ganda (TP4), K-04 awak kapal, isian (TP3–TP4), K-05 taman kota dengan informasi tambahan (TP3–TP5), K-06 menilai kewajaran jawaban orang lain (TP5).

---

## 8. Checklist Desain per Layar

Sebelum layar dianggap selesai:
- [ ] Hanya satu konsep / satu tugas
- [ ] ≤ 40 kata (di luar teks soal)
- [ ] Soal dan alat bantu (tabel/rumus) terlihat bersamaan
- [ ] Maks. 3 warna bermakna; ilustrasi hanya jika diizinkan di §3; tanpa confetti
- [ ] Siswa mengatur kecepatan (tidak ada yang berganti otomatis)
- [ ] Target sentuh ≥ 44 px, font ≥ 16 px, tetap rapi dengan opsi Huruf Besar
- [ ] Rapi di lebar 360 px tanpa gulir horizontal
- [ ] Rapi saat dibuka sebagai aplikasi terpasang (tanpa bilah alamat, perhatikan *safe area* atas/bawah)
