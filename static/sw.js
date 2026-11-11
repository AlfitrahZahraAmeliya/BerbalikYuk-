// Service worker BerbalikYuk!
// WAJIB: naikkan CACHE_VERSION setiap kali ada file statis yang berubah (rilis baru).
const CACHE_VERSION = 'v1';
const CACHE_APP = `berbalikyuk-app-${CACHE_VERSION}`;
const CACHE_FONT = 'berbalikyuk-font';

const ASET = [
  '/',
  '/manifest.webmanifest',
  '/static/css/tokens.css',
  '/static/css/base.css',
  '/static/css/components.css',
  '/static/js/app.js',
  '/static/js/api.js',
  '/static/js/ikon.js',
  '/static/js/pwa.js',
  '/static/js/router.js',
  '/static/js/state.js',
  '/static/js/util.js',
  '/static/js/komponen/umum.js',
  '/static/js/komponen/tabel-rumus.js',
  '/static/js/komponen/simulasi.js',
  '/static/js/halaman/masuk.js',
  '/static/js/halaman/beranda.js',
  '/static/js/halaman/materi.js',
  '/static/js/halaman/contoh.js',
  '/static/js/halaman/latihan.js',
  '/static/js/halaman/kuis.js',
  '/static/js/halaman/progres.js',
  '/static/js/halaman/pengaturan.js',
  '/static/js/halaman/pasang.js',
  '/static/data/materi.json',
  '/static/data/contoh.json',
  '/static/img/siswa.svg',
  '/static/img/pekerja.svg',
  '/static/img/trofi.svg',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  '/static/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_APP).then((cache) => cache.addAll(ASET)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const semua = await caches.keys();
    await Promise.all(semua
      .filter((nama) => nama.startsWith('berbalikyuk-app-') && nama !== CACHE_APP)
      .map((nama) => caches.delete(nama)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Font Google: simpan setelah pertama kali dimuat.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheDulu(request, CACHE_FONT));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Data siswa & penilaian: SELALU dari server, tidak pernah di-cache.
  if (url.pathname.startsWith('/api/')) return;

  // Halaman: coba jaringan dulu agar selalu terbaru; jika offline pakai salinan.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  event.respondWith(cacheDulu(request, CACHE_APP));
});

async function cacheDulu(request, namaCache) {
  const tersimpan = await caches.match(request);
  if (tersimpan) return tersimpan;
  const respons = await fetch(request);
  if (respons.ok || respons.type === 'opaque') {
    const cache = await caches.open(namaCache);
    cache.put(request, respons.clone());
  }
  return respons;
}
