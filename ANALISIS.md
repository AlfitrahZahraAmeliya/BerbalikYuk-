# ANALISIS.md — Tahap *Analysis* (ADDIE)

> Dokumen ini menerjemahkan hasil wawancara *cognitive load* siswa menjadi kebutuhan desain aplikasi.
> Rujukan lanjutan: [PRD.md](PRD.md) (fitur), [DESAIN.md](DESAIN.md) (tampilan & instruksional), [CLAUDE.md](CLAUDE.md) (panduan coding).

---

## 1. Profil Responden

| Informasi | Isian |
|---|---|
| Kode siswa | S01 |
| Kelas saat wawancara | 8 SMP (mempelajari materi saat kelas 7) |
| Tanggal wawancara | 6 November 2026 |
| Pewawancara | Alfitrah Zahra Ameliya |
| Durasi | 18 menit |
| Bukti pernah belajar | Buku catatan |
| Artefak pemicu | 2 soal cerita perbandingan berbalik nilai |
| Kerangka | ADDIE + Cognitive Load Theory (Intrinsic, Extraneous, Germane) |

---

## 2. Ringkasan Temuan Utama

1. **Konsep arah hubungan** ("kenapa satu naik, yang lain turun") belum benar-benar dipahami. Siswa lebih banyak hafal contohnya (IL01).
2. **Penempatan angka ke rumus** sering tertukar (IL02, IL05).
3. **Soal cerita panjang** menjadi titik sulit utama. Masalahnya ada di penyajian, bukan di perhitungan (K03, IL04, EL01, EL05).
4. **Penyajian terpisah** (soal di satu tempat, rumus di tempat lain) memaksa siswa bolak-balik (*split-attention*) (EL02).
5. **Tempo penjelasan** terlalu cepat. Siswa butuh urutan *pengertian → contoh → latihan* (EL04, DS02).
6. **Tampilan sederhana** lebih disukai: sedikit warna, sedikit animasi, sedikit teks per halaman (EL03, DS03).
7. **Yang membantu**: konteks kehidupan sehari-hari, petunjuk menentukan diketahui/ditanya, contoh soal mirip, latihan dari mudah ke sulit (GL01, GL03, DS01, DS02).
8. Siswa sudah punya strategi **cek kewajaran** berdasarkan arah hubungan (GL02). Strategi ini perlu dibuat eksplisit di aplikasi.

---

## 3. Pemetaan Temuan → Implikasi Desain

### 3.1 Pembukaan & Pengalaman Belajar (K)

| Kode | Temuan (ringkas dari kutipan) | Jenis beban | Implikasi fitur | ID Fitur |
|---|---|---|---|---|
| K01 | Awalnya bingung membedakan perbandingan berbalik nilai dengan senilai; contoh yang diingat: pekerja–waktu | IL | Modul khusus membandingkan senilai dan berbalik nilai secara berdampingan | F4, F5 |
| K02 | Belajar dari buku, papan tulis, catat, lalu latihan; bertanya ke teman jika belum paham | K | Aplikasi berperan sebagai "teman yang ditanya": hint dan penjelasan ulang yang bisa dibuka kapan saja | F8 |
| K03 | Langsung mengenali soal pekerja–waktu, tapi bingung pada soal cerita panjang dan menentukan angka untuk rumus | IL, EL | Langkah "tandai informasi" + tabel isian berlabel | F7, F8 |

### 3.2 Intrinsic Cognitive Load (IL)

| Kode | Temuan | Implikasi fitur | ID Fitur |
|---|---|---|---|
| IL01 | Sulit memahami *mengapa* satu besaran bertambah, besaran lain berkurang; bingung jika konteks berubah | **Simulasi interaktif** (slider jumlah pekerja → jumlah hari berubah) dengan penegasan bahwa *hasil kali tetap* (pekerja × hari = total pekerjaan) | F4 |
| IL02 | Urutan: diketahui/ditanya → tentukan jenis → rumus → hitung. Yang tertukar: memasukkan angka ke rumus | Alur penyelesaian **6 langkah tetap** yang selalu sama; tabel isian a₁, b₁, a₂, b₂ yang memandu penempatan; rumus utama **a₁ × b₁ = a₂ × b₂** yang tidak bergantung pada posisi pecahan | F6, F7, F8 |
| IL03 | Prasyarat: perkalian, pembagian, pecahan | **Cek Prasyarat** singkat di awal + kartu pengingat | F3 |
| IL04 | Data langsung = mudah; soal cerita panjang = mulai susah | Latihan **3 level** (data langsung → cerita pendek → cerita panjang) | F8 |
| IL05 | Kesalahan: salah memahami maksud soal, salah memasukkan angka, salah menghitung | **Umpan balik berdasarkan jenis kesalahan** (deteksi otomatis) | F8 |

### 3.3 Extraneous Cognitive Load (EL)

| Kode | Temuan | Implikasi fitur | ID Fitur |
|---|---|---|---|
| EL01 | Konsep sudah paham, tapi kalimat panjang dan informasi tambahan membuat harus membaca ulang | Kalimat soal pendek; di level 3, informasi pengecoh dilatih secara eksplisit lewat fitur tandai | F8 |
| EL02 | Tabel dan gambar membantu; teks panjang sulit; bolak-balik antara soal dan rumus | **Kontiguitas spasial**: soal, tabel, dan rumus berada di satu layar tanpa perlu menggulir jauh | Semua |
| EL03 | Terlalu banyak warna dan animasi mengganggu fokus; informasi tak relevan tidak perlu | Palet warna terbatas, tanpa animasi dekoratif atau confetti; ilustrasi hanya di beranda dan pembuka materi, dan harus relevan dengan konteks | Semua |
| EL04 | Guru terlalu cepat; perlu urutan pengertian → contoh → latihan; bagian "menentukan jenis" dan "rumus" perlu lebih pelan | **Kecepatan diatur siswa** (tombol Lanjut/Ulangi); modul jenis dan rumus dipecah menjadi lebih banyak langkah kecil | F4–F7 |
| EL05 | Sulit memilah angka dan kalimat penting; strategi siswa: baca ulang dan menandai | **Mode tandai**: siswa mengetuk bagian soal lalu memberi label *Diketahui* / *Ditanya* | F7, F8 |

### 3.4 Germane Cognitive Load (GL)

| Kode | Temuan | Implikasi fitur | ID Fitur |
|---|---|---|---|
| GL01 | Contoh kehidupan sehari-hari lalu mencoba sendiri = paling dipahami | Semua soal memakai konteks nyata (pekerja, ternak, kecepatan, keran air, persediaan makanan) | F7, F8 |
| GL02 | Mengecek kewajaran: jika pekerja bertambah tetapi hasil waktu malah lebih lama, berarti ada yang salah | **Langkah "Apakah masuk akal?"** wajib di akhir setiap penyelesaian | F7, F8 |
| GL03 | Terbantu oleh petunjuk menentukan diketahui/ditanya, lalu menghitung sendiri; contoh mirip juga membantu | **Hint 3 tingkat** + *worked example* yang bertahap dipudarkan (*fading*) | F7, F8 |
| GL04 | Pernah menjelaskan ke teman | Pertanyaan refleksi singkat "Jelaskan dengan kata-katamu" (pilihan ganda alasan) setelah modul | F4, F9 |
| GL05 | Jika paham hubungan kedua besaran, bisa mengerjakan cerita yang berbeda | Latihan dengan **variasi konteks**; selalu dimulai dengan pertanyaan "besaran apa dan bagaimana hubungannya?" | F5, F8 |

### 3.5 Rekomendasi Desain dari Siswa (DS)

| Kode | Rekomendasi | Implikasi fitur | ID Fitur |
|---|---|---|---|
| DS01 | Materi mudah dimengerti, gambar/tabel, contoh soal, latihan | Struktur modul: Materi → Contoh → Latihan | F4–F8 |
| DS02 | Pengertian dan rumus dijelaskan pelan; setelah paham, latihan sendiri dari mudah ke sulit | Modul konsep bertahap; level latihan terbuka berurutan | F4, F6, F8 |
| DS03 | Sedikit tulisan per halaman, sedikit warna/animasi, tampilan sederhana, ada gambar pendukung, materi satu per satu | Maks. ±40 kata per layar, satu konsep per layar | Semua |

> ID Fitur (F1–F11) didefinisikan di [PRD.md](PRD.md#4-ruang-lingkup-mvp).

---

## 4. Analisis Artefak Soal Pemicu

### Soal 1 — Pekerja dan waktu
> Sebuah pekerjaan dapat diselesaikan oleh 6 orang pekerja dalam waktu 12 hari. Jika jumlah pekerja ditambah menjadi 9 orang, berapa hari pekerjaan tersebut dapat diselesaikan?

Jawaban siswa:
```
Dik : a₁ = 6, b₁ = 12, a₂ = 9      Dit : b₂ = ?
a₁/a₂ = b₂/b₁  →  6/9 = b₂/12  →  9·b₂ = 6 × 12 = 72  →  b₂ = 8
Jadi, dengan 9 pekerja, pekerjaan selesai dalam 8 hari.
```
**Hasil: benar.** Siswa menulis *Diketahui* dan *Ditanya*, memakai rumus a₁/a₂ = b₂/b₁ dengan tepat, dan menulis kesimpulan.

### Soal 2 — Persediaan rumput ternak
> Seorang peternak memiliki persediaan rumput yang cukup untuk memberi makan 150 ekor domba selama 12 hari. Jika jumlah domba dikurangi menjadi 15 ekor, berapa hari persediaan rumput tersebut akan habis?

Jawaban siswa (dari foto): a₁ = 150, b₁ = 12, a₂ = 15 → 15·b₂ = 150 × 12 = 1.800 → b₂ = 120 hari.

**Hasil: benar.** Siswa menulis *Diketahui* dan *Ditanya*, memakai rumus a₁/a₂ = b₂/b₁ dengan tepat, dan menulis kesimpulan.

### Kesimpulan artefak
- Untuk soal standar, prosedur (rumus & hitung) **sudah dikuasai**.
- Risiko kesalahan ada pada **membaca soal**: menentukan nilai a₂ dari kalimat seperti "ditambah", "dikurangi", "menjadi", atau "setelah … hari".
- Siswa **belum menuliskan cek kewajaran** di lembar jawaban, padahal secara lisan ia punya strateginya (GL02).

### Bukti catatan (buku siswa)
Catatan siswa memuat definisi, rumus a₁/a₂ = b₂/b₁, dan contoh soal pakan ternak. Rumus yang dipakai di kelas adalah **bentuk pecahan**.

**Keputusan notasi:** aplikasi memakai **a₁ × b₁ = a₂ × b₂** sebagai rumus utama, karena:
- bentuk ini langsung menunjukkan makna berbalik nilai (hasil kali tetap, IL01);
- tidak ada posisi pembilang/penyebut yang bisa tertukar (IL02, IL05).

Bentuk pecahan a₁/a₂ = b₂/b₁ tetap ditampilkan di Materi 5 sebagai "bentuk di buku catatanmu", beserta penjelasan bahwa keduanya setara. Dengan begitu tidak terjadi konflik dengan pelajaran di kelas.

---

## 5. Tujuan Pembelajaran

Setelah menggunakan aplikasi, siswa mampu:

| No | Tujuan | Indikator | Modul |
|---|---|---|---|
| TP1 | Menjelaskan hubungan dua besaran yang berbanding terbalik | Menyatakan bahwa hasil kali kedua besaran tetap | F4 |
| TP2 | Membedakan perbandingan senilai dan berbalik nilai | Mengelompokkan situasi dengan benar (≥ 80%) | F5 |
| TP3 | Mengidentifikasi informasi yang diketahui dan ditanya dari soal cerita | Menandai a₁, b₁, a₂ dengan benar | F7, F8 |
| TP4 | Memodelkan dan menghitung nilai yang belum diketahui | Mengisi rumus dengan benar dan menghitung b₂ (atau a₂) | F6, F8 |
| TP5 | Memeriksa kewajaran jawaban | Memilih alasan kewajaran yang tepat | F7, F8 |

Kaitannya dengan **literasi matematika**: TP3 (merumuskan situasi), TP4 (menggunakan prosedur), dan TP5 (menafsirkan dan mengevaluasi hasil dalam konteks).

---

## 6. Analisis Prasyarat

| Prasyarat | Alasan (IL03) | Cara aplikasi menangani |
|---|---|---|
| Perkalian bilangan cacah | Menghitung a₁ × b₁ | Cek Prasyarat soal 1–2 |
| Pembagian | Menghitung b₂ = (a₁ × b₁) / a₂ | Cek Prasyarat soal 3–4 |
| Pecahan & perbandingan sederhana | Membaca bentuk a₁/a₂ = b₂/b₁ | Cek Prasyarat soal 5 + kartu pengingat |

Siswa yang belum lulus cek prasyarat **tetap boleh lanjut**, tetapi akan diberi kartu pengingat dan dicatat (tidak menghambat).

---

## 7. Analisis Konteks Penggunaan

- **Perangkat:** smartphone Android (layar ±360–412 px) dan iPhone, juga laptop/PC lewat browser.
- **Instalasi:** dapat **dipasang di layar utama HP tanpa Play Store/App Store** sebagai *Progressive Web App* (PWA), sehingga terasa seperti aplikasi biasa dan tidak memakan banyak memori.
- **Lingkungan:** belajar mandiri di rumah atau pendamping di kelas.
- **Koneksi:** materi dan contoh soal bisa dibuka **tanpa internet** setelah pertama kali dibuka. Login, latihan, kuis, dan penyimpanan progres membutuhkan internet.
- **Pengguna:** siswa SMP kelas 7 (fase D). Tidak ada halaman guru pada versi ini.

---

## 8. Keterbatasan Analisis

- Data berasal dari **satu responden** (S01). Temuan perlu dikonfirmasi saat uji coba (tahap *Implement* & *Evaluate*), misalnya lewat uji kelompok kecil dan angket *cognitive load*.
- Responden adalah siswa kelas 8 yang mengingat pengalaman kelas 7, jadi ada kemungkinan bias ingatan.

---

## 9. Kerangka Rigorous Mathematical Thinking (RMT)

Rujukan: Kinard & Kozulin, *Rigorous Mathematical Thinking: Conceptual Formation in the Mathematics Classroom*. RMT memadukan teori sosiokultural **Vygotsky** (alat psikologis, konsep ilmiah, *Learning Activity*) dengan **Feuerstein** (fungsi kognitif dan *Mediated Learning Experience*/MLE). Di aplikasi ini, peran mediator dijalankan oleh rancangan langkah dan **Pembimbing AI "Kak Balik"**.

### 9.1 Pemetaan unsur RMT → temuan wawancara → fitur

| Unsur RMT | Temuan terkait | Penerapan di aplikasi |
|---|---|---|
| **Fase Input**: persepsi jelas, ketepatan mengumpulkan data | K03, EL05, IL05 (salah memahami maksud soal) | Langkah *Diketahui/Ditanya*, mode tandai (Latihan Sulit), chip fase **Input** |
| **Fase Elaborasi**: menganalisis hubungan, perencanaan | IL01, IL02 (tertukar angka) | Tentukan hubungan → tabel a/b (**representasi**) → rumus a₁ × b₁ = a₂ × b₂ (**manipulasi**), chip fase **Elaborasi** |
| **Fase Output**: komunikasi tepat, tanpa coba-coba | GL02 (cek kewajaran), IL05 | Jawaban + satuan, langkah **Validasi** (arah hubungan) setelah benar; setelah 2× salah siswa diarahkan ke Kak Balik, bukan menebak |
| **Alat psikologis**: simbol, tabel, rumus, bahasa matematika | EL02, DS01 | Notasi a₁ b₁ a₂ b₂, tabel perbandingan, kotak rumus yang terisi otomatis |
| **MLE: Intensionalitas** | EL04 (tempo terlalu cepat) | Baris *Tujuan* di awal setiap materi |
| **MLE: Makna** | GL01 (konteks sehari-hari) | Baris "Mengapa penting?" di awal setiap materi |
| **MLE: Transendensi** | GL05 (transfer ke cerita lain) | Layar penutup "Hubungkan dengan duniamu" di setiap materi; refleksi setelah latihan |
| **Konsep sehari-hari → ilmiah** (Vygotsky) | K01, GL01 | Materi 1 dimulai dari pengalaman kerja bakti, lalu dirumuskan menjadi konsep |
| **Learning Activity**: analisis tugas, perencanaan, refleksi | GL03, GL04 | Enam langkah tetap + **Refleksi bersama Kak Balik** |
| **ZPD & asesmen dinamis** (bantuan bertahap) | GL03 (petunjuk bertahap) | Bantuan Kak Balik naik tingkat sesuai kesulitan: pemantik → bagian yang dicek → contoh mirip |
| **Siklus Representasi – Manipulasi – Validasi** | IL02, GL02 | Tabel → rumus → validasi arah hubungan |

### 9.2 Peran Pembimbing AI terhadap beban kognitif

| Beban | Strategi Kak Balik |
|---|---|
| **Intrinsik** | Satu langkah kecil per balasan, fokus pada fase yang sedang dikerjakan |
| **Ekstrinsik** | Maks. 4 kalimat pendek (±70 kata), satu ide per balasan, tanpa markdown, tombol pertanyaan cepat agar tidak perlu mengetik, panel di layar yang sama, hanya 2 giliran terakhir terlihat |
| **Germane** | Pertanyaan pemantik "mengapa", validasi, refleksi, dan transendensi |

### 9.3 Cara Kak Balik memilih jenis bantuan (v1.3)

| Kebutuhan siswa (dikenali server + AI) | Respons Kak Balik |
|---|---|
| Pertanyaan **konsep** ("apa itu…", "kenapa…", "bedanya…") | **Menjelaskan**: arti → makna/alasan → contoh sehari-hari dengan representasi singkat → satu pertanyaan cek pemahaman |
| **Macet** saat mengerjakan soal | Bimbingan sesuai **tingkat ZPD** 1–4: orientasi → strategi → langkah terpandu → contoh mirip dengan angka lain |
| **Meminta jawaban** | Menolak singkat, lalu langsung memberi bantuan konkret sesuai tingkat ZPD |
| **Meminta dicek** | Menyebut yang sudah tepat dan satu bagian yang perlu diperbaiki beserta alasannya (metakognisi) |
| **Menjawab pertanyaan Kak Balik** | Menanggapi secara spesifik lalu membawa ke langkah berikutnya |

Tingkat ZPD naik setiap kali siswa bertanya lagi, salah ≥ 2 kali, atau menyatakan bingung. Balasan yang (hampir) sama dengan balasan sebelumnya diminta ulang dengan tingkat bantuan berikutnya.

### 9.4 Evaluasi penerapan RMT & Cognitive Load (v1.4)

Acuan: [docs/ringkasan-rmt.md](docs/ringkasan-rmt.md).

| Komponen | Sebelum (v1.3) | Sekarang (v1.4) |
|---|---|---|
| Fungsi kognitif Input–Elaborasi–Output | Label fase di UI; prompt umum | AI melaporkan `tahap` tiap balasan; prompt merinci fungsi kognitif tiap fase (akurasi data & satuan, sebab-akibat & perencanaan, jawaban tepat tanpa coba-coba + validasi) |
| ZPD / bantuan bertahap | Tingkat 1–4 dari jumlah tanya | Tingkat juga naik bila respons siswa **dinilai keliru**; kerumitan angka diatur sesuai tingkat |
| Pembentukan konsep | Definisi + contoh langsung | **Amati → bandingkan → temukan pola → simpulkan (oleh siswa) → resmikan istilah & makna → terapkan**; 2× kesulitan berturut → penjelasan lengkap lalu siswa menyatakan ulang |
| MLE Intensionalitas & Resiprositas | Lemah | Tujuan mikro saat tahap berganti; setiap balasan menilai respons siswa sebelumnya (`penilaian_respons`) dan memberi **satu tugas** (`giliran_siswa`) |
| MLE Makna & Transendensi | Layar Materi + refleksi | Diresmikan di tahap *simpulkan* (makna) dan *terapkan* (transendensi) di dalam percakapan |
| Metakognisi | Mode refleksi & Validasi | **Wajib** setelah jawaban tepat, pada tahap simpulkan/output/validasi, dan tiap 3 giliran |
| Ganti representasi saat bingung | Belum ada | Server mewajibkan representasi **lebih konkret yang belum dipakai** (cerita konkret ← gambar kata ← tabel ← pola hasil kali ← rumus) |
| Beban intrinsik | Satu ide per balasan | + angka kecil & sedikit unsur di awal, naik bertahap |
| Beban ekstrinsik | Balasan ringkas | + tugas dipisah dan ditonjolkan ("Giliranmu"), lembar chat 60% agar soal tetap terlihat |
| Beban germane | Pertanyaan "mengapa" | + aktivitas memprediksi, membandingkan, menemukan pola, menjelaskan ulang |
| Siswa aktif | Pertanyaan terselip di teks | Setiap balasan diakhiri satu "Giliranmu" yang harus dijawab siswa |

**Yang masih terbatas:** penilaian respons dilakukan oleh AI (bisa keliru menilai); tahap & representasi bergantung pada metadata yang dikembalikan model; belum ada asesmen dinamis format *sandwich* (pra-tes/pasca-tes) karena diputuskan tidak menambah Tes Awal.
