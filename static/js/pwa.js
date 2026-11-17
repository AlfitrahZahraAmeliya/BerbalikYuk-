// Instalasi PWA (tanpa Play Store / App Store) dan pembaruan service worker.
import { toast } from './util.js';

let promptTertunda = null;

// Chrome/Edge di Android & desktop: simpan event agar bisa dipicu tombol "Pasang Aplikasi".
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  promptTertunda = e;
  window.dispatchEvent(new CustomEvent('pwa-berubah'));
});

window.addEventListener('appinstalled', () => {
  promptTertunda = null;
  toast('BerbalikYuk! sudah terpasang di layar utama.');
  window.dispatchEvent(new CustomEvent('pwa-berubah'));
});

export function diIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function diAndroid() {
  return /android/i.test(navigator.userAgent);
}

export function sudahTerpasang() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export function bisaPasangOtomatis() {
  return Boolean(promptTertunda);
}

/** Munculkan dialog instalasi bawaan browser. Mengembalikan true jika siswa setuju. */
export async function pasang() {
  if (!promptTertunda) return false;
  promptTertunda.prompt();
  const { outcome } = await promptTertunda.userChoice;
  promptTertunda = null;
  window.dispatchEvent(new CustomEvent('pwa-berubah'));
  return outcome === 'accepted';
}

// Halaman tanpa isian/jawaban yang sedang dikerjakan: aman dimuat ulang kapan saja.
const RUTE_AMAN = ['', '#/', '#/beranda', '#/progres', '#/pengaturan', '#/tentang', '#/pasang',
  '#/materi', '#/contoh', '#/latihan'];

function halamanAman() {
  return RUTE_AMAN.includes(window.location.hash);
}

export function daftarkanServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Ada pengendali saat halaman dibuka → perubahan pengendali berarti PEMBARUAN versi.
  // Tidak ada → itu pemasangan pertama (clients.claim); jangan memuat ulang.
  const pembaruan = Boolean(navigator.serviceWorker.controller);
  let sudahMuatUlang = false;
  const muatUlang = () => {
    if (sudahMuatUlang) return;
    sudahMuatUlang = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!pembaruan) return;
    // Versi baru sudah aktif. Muat ulang saat aman agar isian/jawaban siswa tidak hilang:
    // langsung di halaman tanpa isian, atau saat siswa pindah halaman berikutnya.
    if (halamanAman()) {
      muatUlang();
    } else {
      toast('Versi baru siap — dipakai saat kamu pindah halaman (atau ketuk di sini).', muatUlang);
      window.addEventListener('hashchange', muatUlang, { once: true });
    }
  });

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      // PWA yang lama di latar belakang: cek pembaruan setiap kali dibuka kembali.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
      // Service worker versi lama (sebelum v5) mungkin masih menunggu: aktifkan sekarang.
      if (reg.waiting && navigator.serviceWorker.controller) reg.waiting.postMessage('SKIP_WAITING');
    } catch (galat) {
      console.warn('Service worker gagal didaftarkan:', galat);
    }
  });
}
