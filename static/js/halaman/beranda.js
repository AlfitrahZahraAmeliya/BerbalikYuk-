// F2 — Beranda: tombol Mulai Belajar, 4 menu utama, banner pasang aplikasi.
import { bisaPasangOtomatis, diIOS, sudahTerpasang } from '../pwa.js';
import { langkahBerikutnya, muatProgres, persenSelesai, state } from '../state.js';
import { h, bacaLokal, simpanLokal } from '../util.js';
import { svgIkon } from '../ikon.js';
import { progressBar } from '../komponen/umum.js';

const MENU = [
  { judul: 'Materi', ikon: 'buku', rute: '#/materi' },
  { judul: 'Contoh Soal', ikon: 'lampu', rute: '#/contoh' },
  { judul: 'Latihan', ikon: 'barbel', rute: '#/latihan' },
  { judul: 'Kuis', ikon: 'trofi', rute: '#/kuis' },
];

const TUJUH_HARI = 7 * 24 * 60 * 60 * 1000;

function bannerPasang() {
  if (sudahTerpasang()) return null;
  if (!bisaPasangOtomatis() && !diIOS()) return null;
  const ditutup = bacaLokal('banner-pasang-ditutup', 0);
  if (Date.now() - ditutup < TUJUH_HARI) return null;

  const banner = h('div', { class: 'banner-pasang' },
    h('img', { src: '/static/icons/icon-192.png', alt: '' }),
    h('div', {}, 'Pasang BerbalikYuk! di HP', h('small', {}, 'Tanpa Play Store, hemat memori')),
    h('a', { class: 'tombol', href: '#/pasang' }, 'Pasang'),
    h('button', {
      class: 'tombol-ikon', 'aria-label': 'Tutup', html: svgIkon('silang'),
      onclick: () => { simpanLokal('banner-pasang-ditutup', Date.now()); banner.remove(); },
    }),
  );
  return banner;
}

export function render(wadah) {
  const isiProgres = h('div');
  const tombolMulai = h('a', { class: 'tombol tombol-penuh', href: langkahBerikutnya().rute, html: `${svgIkon('main')} Mulai Belajar` });

  function gambarProgres() {
    const berikut = langkahBerikutnya();
    tombolMulai.href = berikut.rute;
    const persen = persenSelesai();
    isiProgres.replaceChildren(
      h('div', { class: 'baris-progres' }, progressBar(persen, 100), h('span', { class: 'angka' }, `${persen}%`)),
      h('p', { class: 'teks-lemah teks-kecil' }, persen === 100 ? 'Semua langkah selesai. Hebat!' : `Berikutnya: ${berikut.judul}`),
    );
  }

  const slotBanner = h('div');
  const pasangBanner = () => slotBanner.replaceChildren(bannerPasang() || '');

  wadah.append(h('div', { class: 'tumpuk-lebar' },
    h('section', { class: 'beranda-hero' },
      h('div', { class: 'judul-app' }, h('img', { src: '/static/icons/icon-192.png', alt: '' }), 'BerbalikYuk!'),
      state.siswa ? h('p', { class: 'sapaan' }, `Hai, ${state.siswa.nama}!`) : null,
      h('div', { class: 'hero-isi' },
        h('p', {}, 'Belajar Perbandingan Berbalik Nilai Jadi Lebih Mudah!'),
        h('img', { src: '/static/img/siswa.svg', alt: '' }),
      ),
    ),
    tombolMulai,
    isiProgres,
    h('nav', { class: 'menu-grid', 'aria-label': 'Menu belajar' },
      MENU.map((m) => h('a', { class: 'menu-item', href: m.rute, html: `${svgIkon(m.ikon)}<span>${m.judul}</span>` })),
    ),
    slotBanner,
  ));

  gambarProgres();
  pasangBanner();
  window.addEventListener('pwa-berubah', pasangBanner);
  muatProgres().then(gambarProgres).catch(() => { /* offline: pakai progres tersimpan */ });

  return () => window.removeEventListener('pwa-berubah', pasangBanner);
}
