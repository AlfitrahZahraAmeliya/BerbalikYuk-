// F11 — Panduan memasang aplikasi di HP tanpa Play Store / App Store.
import { bisaPasangOtomatis, diAndroid, diIOS, pasang, sudahTerpasang } from '../pwa.js';
import { h } from '../util.js';
import { svgIkon } from '../ikon.js';
import { kepala } from '../komponen/umum.js';

function langkah(nomor, ikonNama, teks) {
  return h('div', { class: 'langkah' },
    h('span', { class: 'nomor' }, nomor),
    h('div', { class: 'langkah-isi' }, ikonNama ? h('span', { class: 'teks-lemah', html: svgIkon(ikonNama) }) : null, teks));
}

function isiPanduan() {
  if (sudahTerpasang()) {
    return h('div', { class: 'panel-umpan-balik benar' },
      h('span', { class: 'ikon-ub', html: svgIkon('centang') }),
      h('div', {}, h('strong', {}, 'Aplikasi sudah terpasang'), 'Buka BerbalikYuk! dari ikon di layar utama HP-mu.'));
  }

  if (bisaPasangOtomatis()) {
    const tombol = h('button', {
      class: 'tombol tombol-penuh', type: 'button', html: `${svgIkon('pasang')} Pasang Sekarang`,
      onclick: async () => {
        tombol.disabled = true;
        const setuju = await pasang();
        if (!setuju) tombol.disabled = false;
      },
    });
    return h('div', { class: 'tumpuk-lebar' },
      h('p', {}, 'Ketuk tombol di bawah, lalu pilih ', h('strong', {}, 'Instal'), ' / ', h('strong', {}, 'Pasang'), '.'),
      tombol,
      h('p', { class: 'teks-lemah teks-kecil' }, 'Ukurannya sangat kecil dan tidak perlu Play Store.'));
  }

  if (diIOS()) {
    return h('div', { class: 'kartu tumpuk-lebar' },
      h('h3', {}, 'Di iPhone / iPad (Safari)'),
      langkah(1, null, 'Pastikan halaman ini dibuka di Safari.'),
      langkah(2, 'bagikan', 'Ketuk tombol Bagikan (kotak dengan panah ke atas) di bagian bawah layar.'),
      langkah(3, 'tambah', 'Gulir, lalu pilih "Tambahkan ke Layar Utama".'),
      langkah(4, null, 'Ketuk "Tambah". Ikon BerbalikYuk! akan muncul di layar utama.'));
  }

  if (diAndroid()) {
    return h('div', { class: 'kartu tumpuk-lebar' },
      h('h3', {}, 'Di HP Android'),
      langkah(1, null, 'Buka halaman ini di Google Chrome.'),
      langkah(2, null, 'Ketuk menu ⋮ (titik tiga) di kanan atas.'),
      langkah(3, 'pasang', 'Pilih "Instal aplikasi" atau "Tambahkan ke layar utama".'),
      langkah(4, null, 'Ketuk "Instal". Ikon BerbalikYuk! akan muncul di layar utama.'));
  }

  return h('div', { class: 'kartu tumpuk-lebar' },
    h('h3', {}, 'Di komputer (Chrome / Edge)'),
    langkah(1, 'pasang', 'Klik ikon Instal di ujung kanan kolom alamat browser.'),
    langkah(2, null, 'Pilih "Instal". Aplikasi akan terbuka di jendela sendiri.'),
    h('p', { class: 'teks-lemah teks-kecil' }, 'Untuk HP, buka alamat yang sama di browser HP-mu.'));
}

export function render(wadah) {
  const slot = h('div');
  const gambar = () => slot.replaceChildren(isiPanduan());
  wadah.append(h('div', { class: 'tumpuk-lebar' },
    kepala({ judul: 'Pasang Aplikasi', kembali: '#/pengaturan' }),
    h('div', { class: 'kartu-header' },
      h('div', { class: 'tumpuk' },
        h('h1', {}, 'BerbalikYuk! di layar utama'),
        h('p', {}, 'Buka seperti aplikasi biasa. Materi tetap bisa dibaca saat tidak ada sinyal.')),
      h('img', { src: '/static/icons/icon-192.png', alt: '' })),
    slot,
  ));
  gambar();
  window.addEventListener('pwa-berubah', gambar);
  return () => window.removeEventListener('pwa-berubah', gambar);
}
