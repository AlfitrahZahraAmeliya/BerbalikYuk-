// Komponen kecil yang dipakai banyak halaman.
import { h } from '../util.js';
import { ikon, svgIkon } from '../ikon.js';

/** Kepala halaman: tombol kembali, judul, dan posisi (mis. "2 / 5"). */
export function kepala({ judul, kembali = '#/beranda', kanan = null }) {
  return h('header', { class: 'kepala' },
    kembali
      ? h('a', { class: 'tombol-ikon', href: kembali, 'aria-label': 'Kembali', html: svgIkon('kembali') })
      : h('span'),
    h('h2', {}, judul),
    kanan == null ? h('span') : typeof kanan === 'string' ? h('span', { class: 'posisi' }, kanan) : kanan,
  );
}

export function progressBar(nilai, total) {
  const persen = total ? Math.round((nilai / total) * 100) : 0;
  const isi = h('span');
  isi.style.width = `${persen}%`;
  return h('div', {
    class: 'progress-bar', role: 'progressbar',
    'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': nilai,
  }, isi);
}

/** Panel umpan balik di bawah soal (bukan pop-up). */
export function panelUmpanBalik(benar, pesan, pembahasan = null) {
  return h('div', { class: `panel-umpan-balik ${benar ? 'benar' : 'salah'}`, role: 'status' },
    h('span', { class: 'ikon-ub', html: svgIkon(benar ? 'centang' : 'seru') }),
    h('div', {},
      h('strong', {}, benar ? 'Benar!' : 'Belum tepat'),
      h('span', {}, pesan),
      pembahasan ? h('div', { class: 'pembahasan' }, h('strong', {}, 'Pembahasan'), pembahasan) : null,
    ),
  );
}

export function panelHint(n, total, teks) {
  return h('div', { class: 'panel-hint', role: 'status' },
    ikon('lampu'),
    h('div', {}, h('small', {}, `Petunjuk ${n} dari ${total}`), teks),
  );
}

export function pesanGalat(teks, aksiUlang) {
  return h('div', { class: 'kartu tumpuk tengah' },
    h('p', { class: 'pesan-galat' }, teks),
    aksiUlang ? h('button', { class: 'tombol tombol-garis', onclick: aksiUlang }, 'Coba lagi') : null,
  );
}

/** Fase RMT: Input → Elaborasi → Output. aktif = 'input' | 'elaborasi' | 'output' | 'refleksi'. */
export const FASE_RMT = [
  { id: 'input', judul: 'Input', arti: 'Kumpulkan informasi' },
  { id: 'elaborasi', judul: 'Elaborasi', arti: 'Olah hubungan & rumus' },
  { id: 'output', judul: 'Output', arti: 'Jawab & periksa' },
];

export function faseRMT(aktif) {
  const el = h('ol', { class: 'fase-rmt', 'aria-label': 'Tahap berpikir' });
  const gambar = (baru) => {
    const urutan = FASE_RMT.findIndex((f) => f.id === baru);
    const semuaSelesai = baru === 'refleksi';
    el.replaceChildren(...FASE_RMT.map((f, n) => h('li', {
      class: semuaSelesai || n < urutan ? 'selesai' : n === urutan ? 'aktif' : null,
      'aria-current': n === urutan ? 'step' : null,
      title: f.arti,
    }, f.judul)));
  };
  gambar(aktif);
  return { el, set: gambar };
}

/** Chip kecil nama fase untuk judul langkah. */
export function chipFase(fase) {
  const f = FASE_RMT.find((x) => x.id === fase);
  return f ? h('span', { class: `chip-fase ${fase}` }, f.judul) : null;
}

/** Tombol "Lanjut" dengan panah. */
export function tombolLanjut(teks = 'Lanjut', onclick, props = {}) {
  return h('button', { class: 'tombol', onclick, ...props }, teks, ' →');
}
