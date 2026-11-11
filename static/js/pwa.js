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

export function daftarkanServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const tawarkanPembaruan = (sw) => {
        toast('Versi baru tersedia — ketuk untuk memuat ulang.', () => sw.postMessage('SKIP_WAITING'));
      };
      if (reg.waiting && navigator.serviceWorker.controller) tawarkanPembaruan(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const baru = reg.installing;
        baru?.addEventListener('statechange', () => {
          if (baru.state === 'installed' && navigator.serviceWorker.controller) tawarkanPembaruan(baru);
        });
      });
      let sudahMuatUlang = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (sudahMuatUlang) return;
        sudahMuatUlang = true;
        window.location.reload();
      });
    } catch (galat) {
      console.warn('Service worker gagal didaftarkan:', galat);
    }
  });
}
