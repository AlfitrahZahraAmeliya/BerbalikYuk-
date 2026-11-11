// F9 — Kuis akhir: satu soal per layar, tanpa petunjuk; dinilai di server.
import { api } from '../api.js';
import { muatProgres } from '../state.js';
import { bacaAngka, denganSatuan, h } from '../util.js';
import { svgIkon } from '../ikon.js';
import { kepala, pesanGalat, progressBar, tombolLanjut } from '../komponen/umum.js';

const NAMA_TP = {
  TP1: 'Memahami konsep',
  TP2: 'Membedakan jenis perbandingan',
  TP3: 'Membaca soal cerita',
  TP4: 'Menghitung',
  TP5: 'Memeriksa kewajaran',
};

function opsiTampil(soal, nilai) {
  if (soal.tipe === 'jenis') return nilai === 'senilai' ? 'Senilai' : 'Berbalik nilai';
  if (soal.tipe === 'pilihan_ganda') return denganSatuan(nilai, soal.satuan);
  return String(nilai);
}

function renderHasil(wadah, hasil, ulangi) {
  const tinggi = hasil.skor >= 80;
  const daftarTP = h('div', { class: 'kartu' }, h('h3', {}, 'Kemampuanmu'),
    Object.entries(hasil.skor_per_tp).map(([tp, nilai]) => h('div', { class: 'bar-kemampuan' },
      h('span', { class: 'teks-kecil' }, NAMA_TP[tp] || tp),
      progressBarSederhana(nilai),
      h('span', { class: 'nilai' }, nilai))));

  const pembahasan = h('div', { class: 'tumpuk', hidden: true },
    hasil.pembahasan.map((p, i) => h('div', { class: 'kartu tumpuk' },
      h('div', { class: 'langkah' },
        h('span', { class: `nomor${p.benar ? ' selesai' : ''}`, html: p.benar ? svgIkon('centang') : String(i + 1) }),
        h('div', { class: 'langkah-isi tumpuk' },
          h('p', {}, h('strong', {}, p.teks)),
          h('p', { class: 'teks-kecil' }, 'Jawabanmu: ', p.jawabanmu == null || p.jawabanmu === '' ? '(kosong)' : String(p.jawabanmu)),
          h('p', { class: 'teks-kecil' }, 'Jawaban benar: ', h('strong', {}, p.kunci)),
          h('p', { class: 'kotak-kesimpulan teks-kecil' }, h('span', {}, p.pembahasan)),
        ))),
  ));

  const tombolPembahasan = h('button', {
    class: 'tombol tombol-garis tombol-penuh', type: 'button',
    onclick: () => {
      pembahasan.hidden = !pembahasan.hidden;
      tombolPembahasan.textContent = pembahasan.hidden ? 'Lihat Pembahasan' : 'Tutup Pembahasan';
    },
  }, 'Lihat Pembahasan');

  wadah.replaceChildren(h('div', { class: 'tumpuk-lebar' },
    h('div', { class: 'hasil-kuis tumpuk' },
      h('img', { src: '/static/img/trofi.svg', alt: '' }),
      h('span', { class: 'pita-judul' }, 'Kuis Selesai!'),
      h('p', { class: 'teks-lemah' }, 'Skor Kamu'),
      h('p', { class: 'skor-besar' }, hasil.skor, h('small', {}, ' / 100')),
      h('p', {}, tinggi ? 'Hebat! Kamu sudah memahami materi dengan baik!' : 'Bagus! Ulangi bagian yang masih kurang agar lebih mantap.'),
    ),
    daftarTP,
    tombolPembahasan,
    pembahasan,
    h('button', { class: 'tombol tombol-penuh', type: 'button', onclick: ulangi }, 'Ulangi Kuis'),
    h('a', { class: 'tombol-teks tengah', href: '#/beranda' }, 'Kembali ke Beranda'),
  ));
}

function progressBarSederhana(nilai) {
  const isi = h('span');
  isi.style.width = `${nilai}%`;
  return h('div', { class: 'progress-bar' }, isi);
}

function renderKuis(wadah, daftarSoal, ulangi) {
  const jawaban = {};
  let i = 0;

  function gambar() {
    const soal = daftarSoal[i];
    const terakhir = i === daftarSoal.length - 1;
    const lanjut = tombolLanjut(terakhir ? 'Kirim Jawaban' : 'Berikutnya', async () => {
      if (!terakhir) { i += 1; gambar(); return; }
      lanjut.disabled = true;
      try {
        const hasil = await api.kirimKuis(jawaban);
        muatProgres().catch(() => {});
        renderHasil(wadah, hasil, ulangi);
        window.scrollTo(0, 0);
      } catch (galat) {
        lanjut.disabled = false;
        slotGalat.replaceChildren(pesanGalat(galat.message));
      }
    }, { disabled: !(soal.id in jawaban) });
    const slotGalat = h('div');

    let isian;
    if (soal.tipe === 'isian') {
      const input = h('input', {
        class: 'input', id: 'jawaban-kuis', inputmode: 'decimal', autocomplete: 'off', value: jawaban[soal.id] ?? '',
        oninput: (e) => {
          if (bacaAngka(e.target.value) != null) jawaban[soal.id] = e.target.value;
          else delete jawaban[soal.id];
          lanjut.disabled = !(soal.id in jawaban);
        },
      });
      isian = h('div', { class: 'tumpuk' },
        h('label', { for: 'jawaban-kuis' }, h('h3', {}, 'Jawaban')),
        h('div', { class: 'input-jawaban' }, input, h('span', {}, soal.satuan)));
    } else {
      const tombol = soal.opsi.map((nilai, n) => h('button', {
        class: 'opsi', type: 'button', 'aria-pressed': String(jawaban[soal.id] === nilai),
        onclick: (e) => {
          jawaban[soal.id] = nilai;
          tombol.forEach((t) => t.setAttribute('aria-pressed', String(t === e.currentTarget)));
          lanjut.disabled = false;
        },
      }, h('span', { class: 'huruf' }, String.fromCharCode(65 + n)), opsiTampil(soal, nilai)));
      isian = h('div', { class: soal.tipe === 'jenis' ? 'dua-pilihan' : 'daftar-opsi' }, tombol);
    }

    wadah.replaceChildren(h('div', { class: 'tumpuk-lebar' },
      kepala({ judul: 'Kuis', kembali: '#/beranda', kanan: `${i + 1} / ${daftarSoal.length}` }),
      progressBar(i + 1, daftarSoal.length),
      h('div', { class: 'kartu-soal' }, h('span', { class: 'label-chip' }, `Soal ${i + 1}:`), h('p', {}, soal.teks)),
      isian,
      slotGalat,
      h('div', { class: 'baris-tombol' },
        i > 0 ? h('button', { class: 'tombol tombol-garis', type: 'button', onclick: () => { i -= 1; gambar(); } }, '← Sebelumnya') : null,
        lanjut),
    ));
  }
  gambar();
}

function renderPembuka(wadah, mulai) {
  wadah.append(h('div', { class: 'tumpuk-lebar' },
    kepala({ judul: 'Kuis', kembali: '#/beranda' }),
    h('div', { class: 'kartu-judul tumpuk' },
      h('h1', {}, 'Kuis Perbandingan Berbalik Nilai'),
      h('p', {}, '6 soal campuran. Tidak ada petunjuk. Jawaban dinilai setelah semua dikirim.')),
    h('ul', { class: 'daftar-centang' },
      ['Kerjakan dengan tenang, tidak ada batas waktu', 'Kamu bisa kembali ke soal sebelumnya', 'Setelah selesai, lihat pembahasannya']
        .map((t) => h('li', { html: svgIkon('centang') }, h('span', {}, t)))),
    h('button', { class: 'tombol tombol-penuh', type: 'button', onclick: mulai }, 'Mulai Kuis'),
  ));
}

export function render(wadah) {
  const mulai = async () => {
    wadah.replaceChildren(h('p', { class: 'memuat' }, 'Menyiapkan kuis…'));
    try {
      const data = await api.kuis();
      renderKuis(wadah, data.soal, mulai);
    } catch (galat) {
      wadah.replaceChildren(h('div', { class: 'tumpuk-lebar' },
        kepala({ judul: 'Kuis', kembali: '#/beranda' }),
        pesanGalat(galat.message, mulai)));
    }
  };
  renderPembuka(wadah, mulai);
}
