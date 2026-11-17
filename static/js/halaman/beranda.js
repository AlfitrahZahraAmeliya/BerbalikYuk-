// F2 — Beranda: tombol Mulai Belajar, 4 menu utama, banner pasang aplikasi.
import { bisaPasangOtomatis, diIOS, sudahTerpasang } from '../pwa.js';
import { langkahBerikutnya, muatProgres, muatStatusAI, persenSelesai, state } from '../state.js';
import { h, bacaLokal, simpanLokal } from '../util.js';
import { svgIkon } from '../ikon.js';
import { progressBar } from '../komponen/umum.js';
import { aiTersedia, kakBalik, namaPembimbing } from '../komponen/pembimbing.js';

/** Kartu pengenalan Kak Balik: menjelaskan fungsinya, tidak membuka chat otomatis. */
function kartuKakBalik() {
  if (!aiTersedia()) return null;
  const nama = namaPembimbing();
  return h('section', { class: 'kartu-kak-balik', 'aria-label': `Kenalan dengan ${nama}` },
    h('span', { class: 'nomor', html: svgIkon('pesan') }),
    h('div', { class: 'tumpuk' },
      h('strong', {}, `Kenalan dengan ${nama}`),
      h('p', { class: 'teks-kecil' }, 'Kakak pembimbing yang menemanimu berpikir langkah demi langkah. '
        + `${nama} tidak memberi jawaban, tapi membantumu menemukannya sendiri.`),
      h('p', { class: 'teks-kecil teks-lemah' }, 'Ada di Materi, Contoh Soal, dan Latihan. Tidak tersedia saat Kuis.'),
      h('button', {
        class: 'tombol tombol-garis', type: 'button',
        onclick: () => kakBalik.buka({ sumber: 'umum', ref: 'beranda', tanpaFab: true }),
      }, `Coba tanya ${nama}`)));
}

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

  // Kartu Kak Balik untuk SEMUA siswa (tidak bergantung progres). Digambar ulang
  // ketika status AI berubah, misalnya baru selesai dimuat atau koneksi kembali.
  const slotKakBalik = h('div');
  const gambarKartu = () => slotKakBalik.replaceChildren(kartuKakBalik() || '');

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
    slotKakBalik,
    slotBanner,
  ));

  gambarProgres();
  pasangBanner();
  gambarKartu();
  window.addEventListener('pwa-berubah', pasangBanner);
  window.addEventListener('ai-berubah', gambarKartu);
  if (!state.ai.dimuat) muatStatusAI();
  muatProgres().then(gambarProgres).catch(() => { /* offline: pakai progres tersimpan */ });

  return () => {
    window.removeEventListener('pwa-berubah', pasangBanner);
    window.removeEventListener('ai-berubah', gambarKartu);
  };
}
