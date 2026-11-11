// F10/F11 — Pengaturan: ukuran huruf, pasang aplikasi, keluar.
import { api } from '../api.js';
import { setSiswa, state } from '../state.js';
import { sudahTerpasang } from '../pwa.js';
import { bacaLokal, h, simpanLokal } from '../util.js';
import { svgIkon } from '../ikon.js';

export function terapkanUkuranHuruf() {
  document.documentElement.classList.toggle('huruf-besar', bacaLokal('huruf-besar', false));
}

export function render(wadah) {
  const besar = bacaLokal('huruf-besar', false);
  const tombolUkuran = (nilai, teks) => h('button', {
    class: 'opsi', type: 'button', 'aria-pressed': String(besar === nilai),
    onclick: () => {
      simpanLokal('huruf-besar', nilai);
      terapkanUkuranHuruf();
      wadah.replaceChildren();
      render(wadah);
    },
  }, teks);

  wadah.append(h('div', { class: 'tumpuk-lebar' },
    h('header', { class: 'kepala' }, h('span'), h('h2', {}, 'Pengaturan'), h('span')),
    state.siswa ? h('div', { class: 'kartu' },
      h('p', {}, h('strong', {}, state.siswa.nama)),
      h('p', { class: 'teks-lemah' }, `Kelas ${state.siswa.kelas} · @${state.siswa.username}`)) : null,
    h('section', { class: 'tumpuk' },
      h('h3', { html: `Ukuran huruf` }),
      h('div', { class: 'dua-pilihan' }, tombolUkuran(false, 'Normal'), tombolUkuran(true, 'Besar'))),
    h('ul', { class: 'daftar-menu' },
      h('li', {}, h('a', { class: 'item-menu', href: '#/pasang' },
        h('span', { class: `nomor${sudahTerpasang() ? ' selesai' : ''}`, html: svgIkon(sudahTerpasang() ? 'centang' : 'pasang') }),
        h('span', { class: 'judul-item' }, 'Pasang Aplikasi',
          h('small', {}, sudahTerpasang() ? 'Sudah terpasang' : 'Tanpa Play Store / App Store')),
        h('span', { class: 'panah', html: svgIkon('panah') }))),
      h('li', {}, h('a', { class: 'item-menu', href: '#/tentang' },
        h('span', { class: 'nomor', html: svgIkon('info') }),
        h('span', { class: 'judul-item' }, 'Tentang BerbalikYuk!'),
        h('span', { class: 'panah', html: svgIkon('panah') }))),
    ),
    h('button', {
      class: 'tombol tombol-garis tombol-penuh', type: 'button', html: `${svgIkon('keluar')} Keluar`,
      onclick: async () => {
        try { await api.keluar(); } catch { /* tetap keluar di perangkat ini */ }
        setSiswa(null);
        window.location.hash = '#/masuk';
      },
    }),
  ));
}

export function renderTentang(wadah) {
  wadah.append(h('div', { class: 'tumpuk-lebar' },
    h('header', { class: 'kepala' },
      h('a', { class: 'tombol-ikon', href: '#/pengaturan', 'aria-label': 'Kembali', html: svgIkon('kembali') }),
      h('h2', {}, 'Tentang'), h('span')),
    h('div', { class: 'kartu tumpuk' },
      h('div', { class: 'judul-app' }, h('img', { src: '/static/icons/icon-192.png', alt: '' }), 'BerbalikYuk!'),
      h('p', {}, 'Aplikasi belajar Perbandingan Berbalik Nilai untuk siswa SMP. Dirancang berdasarkan Cognitive Load Theory dan model ADDIE: materi disajikan sedikit demi sedikit, dengan kecepatan yang kamu atur sendiri.'),
      h('p', { class: 'teks-lemah teks-kecil' }, 'Dikembangkan oleh Alfitrah Zahra Ameliya (2225250181), S1 Pendidikan Matematika, mata kuliah Algoritma dan Pemrograman.'),
    ),
  ));
}
