// F10 — Progres belajar: cincin total skor, daftar materi, kemampuan per tujuan pembelajaran.
import { URUTAN, muatProgres, persenSelesai, skor, state, sudahSelesai, totalSkor } from '../state.js';
import { h } from '../util.js';
import { svgIkon } from '../ikon.js';
import { kepala } from '../komponen/umum.js';

const NAMA_TP = {
  TP1: 'Memahami konsep',
  TP2: 'Membedakan jenis',
  TP3: 'Membaca soal cerita',
  TP4: 'Menghitung',
  TP5: 'Cek kewajaran',
};

function cincin(persen) {
  const r = 36;
  const keliling = 2 * Math.PI * r;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 84 84');
  svg.setAttribute('class', 'cincin-skor');
  svg.setAttribute('aria-hidden', 'true');
  for (const [kelas, panjang] of [['jalur', keliling], ['isi-cincin', (keliling * persen) / 100]]) {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', 42); c.setAttribute('cy', 42); c.setAttribute('r', r);
    c.setAttribute('class', kelas);
    c.setAttribute('stroke-dasharray', `${panjang} ${keliling}`);
    svg.append(c);
  }
  return svg;
}

function barKemampuan(nama, nilai) {
  const isi = h('span');
  isi.style.width = `${nilai}%`;
  return h('div', { class: 'bar-kemampuan' },
    h('span', { class: 'teks-kecil' }, nama),
    h('div', { class: 'progress-bar' }, isi),
    h('span', { class: 'nilai' }, nilai));
}

function gambar(wadah) {
  const total = totalSkor();
  const persen = persenSelesai();
  const kuis = state.kuisTerakhir;

  wadah.replaceChildren(h('div', { class: 'tumpuk-lebar' },
    kepala({ judul: 'Progres Belajar', kembali: '#/beranda' }),
    h('section', { class: 'kartu kartu-skor' },
      h('span', { class: 'nomor', html: svgIkon('grafik') }),
      h('div', {},
        h('p', { class: 'teks-lemah teks-kecil' }, 'Total Skor'),
        h('p', { class: 'angka-besar' }, total == null ? '–' : `${total}%`),
        h('p', { class: 'teks-kecil teks-lemah' }, `${persen}% langkah selesai`)),
      cincin(total ?? 0),
    ),
    h('section', { class: 'tumpuk' },
      h('h2', {}, 'Materi yang Sudah Dipelajari'),
      h('ul', { class: 'daftar-menu' }, URUTAN.map((l) => {
        const selesai = sudahSelesai(l.id);
        const nilai = skor(l.id);
        return h('li', {}, h('a', { class: 'item-menu', href: l.rute },
          h('span', { class: `nomor${selesai ? ' selesai' : ' kunci'}`, html: selesai ? svgIkon('centang') : '' }),
          h('span', { class: 'judul-item' }, l.judul,
            h('small', {}, selesai ? (nilai != null && l.id !== 'prasyarat' ? `Skor terbaik: ${nilai}` : 'Selesai') : 'Belum')),
        ));
      })),
    ),
    kuis
      ? h('section', { class: 'kartu tumpuk' },
        h('h2', {}, 'Kemampuan (kuis terakhir)'),
        Object.entries(kuis.skor_per_tp || {}).map(([tp, nilai]) => barKemampuan(NAMA_TP[tp] || tp, nilai)))
      : h('p', { class: 'teks-lemah' }, 'Kerjakan Kuis untuk melihat kemampuanmu per bagian.'),
    h('div', { class: 'panel-hint' },
      h('span', { html: svgIkon('bintang') }),
      h('div', {}, persen >= 50 ? 'Kamu sudah hebat! Terus belajar ya!' : 'Sedikit demi sedikit, lama-lama jadi bisa. Semangat!')),
  ));
}

export function render(wadah) {
  gambar(wadah);
  muatProgres().then(() => gambar(wadah)).catch(() => { /* offline */ });
}
