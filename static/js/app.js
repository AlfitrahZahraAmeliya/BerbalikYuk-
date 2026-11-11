// Titik awal aplikasi: cek sesi, daftarkan service worker, jalankan router.
import { api, GalatOffline, kirimAntrean } from './api.js';
import { daftarkanServiceWorker } from './pwa.js';
import { mulaiRouter } from './router.js';
import { setSiswa, state } from './state.js';
import { h, toast } from './util.js';
import { svgIkon } from './ikon.js';

import * as masuk from './halaman/masuk.js';
import * as beranda from './halaman/beranda.js';
import * as materi from './halaman/materi.js';
import * as contoh from './halaman/contoh.js';
import * as latihan from './halaman/latihan.js';
import * as kuis from './halaman/kuis.js';
import * as progres from './halaman/progres.js';
import * as pengaturan from './halaman/pengaturan.js';
import * as pasang from './halaman/pasang.js';

const wadah = document.getElementById('isi');
const nav = document.getElementById('nav-bawah');

const NAV = [
  { id: 'beranda', judul: 'Beranda', ikon: 'rumah', rute: '#/beranda' },
  { id: 'progres', judul: 'Progres', ikon: 'grafik', rute: '#/progres' },
  { id: 'pengaturan', judul: 'Pengaturan', ikon: 'gerigi', rute: '#/pengaturan' },
];

function gambarNav(aktif) {
  const tampil = Boolean(aktif);
  nav.hidden = !tampil;
  document.body.classList.toggle('ada-nav', tampil);
  if (!tampil) return;
  nav.replaceChildren(...NAV.map((n) => h('a', {
    href: n.rute, 'aria-current': n.id === aktif ? 'page' : null,
    html: `${svgIkon(n.ikon)}<span>${n.judul}</span>`,
  })));
}

function tampilkanOffline() {
  if (!state.offline || wadah.querySelector('.pita-offline')) return;
  wadah.prepend(h('p', { class: 'pita-offline', role: 'status' },
    'Kamu sedang offline. Materi dan contoh soal tetap bisa dibuka.'));
}

const RUTE = [
  { pola: '/masuk', halaman: (w) => masuk.render(w, { mode: 'masuk' }), publik: true, hanyaTamu: true },
  { pola: '/daftar', halaman: (w) => masuk.render(w, { mode: 'daftar' }), publik: true, hanyaTamu: true },
  { pola: '/beranda', halaman: beranda.render, nav: 'beranda' },
  { pola: '/materi/:id?/:layar?', halaman: materi.render },
  { pola: '/contoh/:n?', halaman: contoh.render },
  { pola: '/latihan/:tingkat?', halaman: latihan.render },
  { pola: '/kuis', halaman: kuis.render },
  { pola: '/progres', halaman: progres.render, nav: 'progres' },
  { pola: '/pengaturan', halaman: pengaturan.render, nav: 'pengaturan' },
  { pola: '/tentang', halaman: pengaturan.renderTentang, nav: 'pengaturan' },
  { pola: '/pasang', halaman: pasang.render },
];

async function cekSesi() {
  try {
    setSiswa(await api.saya());
    state.offline = false;
  } catch (galat) {
    if (galat instanceof GalatOffline) {
      state.offline = true;          // tetap pakai data siswa tersimpan
    } else {
      setSiswa(null);                // sesi habis / belum login
    }
  }
}

async function mulai() {
  pengaturan.terapkanUkuranHuruf();
  daftarkanServiceWorker();
  await cekSesi();

  window.addEventListener('sesi-habis', () => {
    setSiswa(null);
    toast('Sesi berakhir. Silakan masuk lagi.');
    window.location.hash = '#/masuk';
  });
  window.addEventListener('online', () => {
    state.offline = false;
    kirimAntrean().catch(() => {});
    document.querySelector('.pita-offline')?.remove();
  });
  window.addEventListener('offline', () => { state.offline = true; tampilkanOffline(); });

  if (!state.offline) kirimAntrean().catch(() => {});

  mulaiRouter(RUTE, {
    wadah,
    sudahLogin: () => Boolean(state.siswa),
    sebelumRender: (rute) => gambarNav(rute.nav),
  });
  window.addEventListener('hashchange', () => setTimeout(tampilkanOffline, 0));
  setTimeout(tampilkanOffline, 0);
}

mulai();
