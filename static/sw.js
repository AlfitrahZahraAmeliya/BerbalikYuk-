// Service worker BerbalikYuk!
// Strategi: file aplikasi diambil dari JARINGAN dulu (selalu versi terbaru saat online),
// cache hanya cadangan saat offline. Versi baru langsung aktif tanpa menunggu siswa
// mengetuk apa pun, sehingga pengguna lama tidak tertinggal di versi lama.
// Tetap naikkan CACHE_VERSION setiap rilis agar cache offline diperbarui.
const CACHE_VERSION = 'v5';
const BATAS_TUNGGU_JARINGAN = 4000; // ms; jaringan lambat → pakai cache dulu
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
  '/static/js/komponen/pembimbing.js',
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
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_APP);
    // cache: 'reload' → ambil langsung dari server, bukan dari cache HTTP browser yang bisa basi.
    await cache.addAll(ASET.map((url) => new Request(url, { cache: 'reload' })));
    // Aktif segera: jangan menunggu siswa mengetuk "Versi baru tersedia".
    await self.skipWaiting();
  })());
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

  // Font Google: jarang berubah, simpan setelah pertama kali dimuat.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheDulu(request, CACHE_FONT));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Data siswa & penilaian: SELALU dari server, tidak pernah di-cache.
  if (url.pathname.startsWith('/api/')) return;

  // Halaman & file aplikasi: jaringan dulu, cache sebagai cadangan offline.
  const cadanganNavigasi = request.mode === 'navigate' ? '/' : null;
  event.respondWith(jaringanDulu(request, cadanganNavigasi));
});

async function jaringanDulu(request, cadangan) {
  const cache = await caches.open(CACHE_APP);
  const dariJaringan = fetch(request).then((respons) => {
    if (respons.ok && respons.type === 'basic') cache.put(request, respons.clone());
    return respons;
  });
  dariJaringan.catch(() => {}); // cegah "unhandled rejection" bila cache yang dipakai
  try {
    return await Promise.race([
      dariJaringan,
      new Promise((_, gagal) => setTimeout(() => gagal(new Error('lambat')), BATAS_TUNGGU_JARINGAN)),
    ]);
  } catch {
    const tersimpan = (await cache.match(request)) || (cadangan && (await cache.match(cadangan)));
    if (tersimpan) return tersimpan;
    return dariJaringan; // tidak ada salinan: tunggu jaringan apa adanya
  }
}

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
