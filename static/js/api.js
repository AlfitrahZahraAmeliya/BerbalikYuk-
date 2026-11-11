// SEMUA komunikasi dengan server Flask lewat file ini.
import { bacaLokal, simpanLokal } from './util.js';

export class GalatApi extends Error {
  constructor(pesan, status) {
    super(pesan);
    this.status = status;
  }
}

export class GalatOffline extends Error {
  constructor() {
    super('Butuh internet. Periksa koneksimu, lalu coba lagi.');
  }
}

async function panggil(metode, path, body) {
  let respons;
  try {
    respons = await fetch(path, {
      method: metode,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new GalatOffline();
  }
  if (respons.status === 204) return null;
  let data = null;
  try { data = await respons.json(); } catch { /* bukan JSON */ }
  if (!respons.ok) {
    if (respons.status === 401 && !['/api/masuk', '/api/daftar'].includes(path)) {
      window.dispatchEvent(new CustomEvent('sesi-habis'));
    }
    throw new GalatApi(data?.galat || 'Terjadi gangguan. Coba lagi sebentar lagi.', respons.status);
  }
  return data;
}

// ---- Antrean progres saat offline ----
const KUNCI_ANTREAN = 'antrean-progres';

async function kirimProgres(data) {
  try {
    return await panggil('POST', '/api/progres', data);
  } catch (galat) {
    if (galat instanceof GalatOffline) {
      const antrean = bacaLokal(KUNCI_ANTREAN, []);
      antrean.push(data);
      simpanLokal(KUNCI_ANTREAN, antrean);
      return { ok: true, tertunda: true };
    }
    throw galat;
  }
}

export async function kirimAntrean() {
  const antrean = bacaLokal(KUNCI_ANTREAN, []);
  if (!antrean.length) return;
  simpanLokal(KUNCI_ANTREAN, []);
  for (const data of antrean) {
    await kirimProgres(data); // jika masih offline, otomatis masuk antrean lagi
  }
}

export const api = {
  saya: () => panggil('GET', '/api/saya'),
  masuk: (username, sandi) => panggil('POST', '/api/masuk', { username, sandi }),
  daftar: (data) => panggil('POST', '/api/daftar', data),
  keluar: () => panggil('POST', '/api/keluar'),
  progres: () => panggil('GET', '/api/progres'),
  simpanProgres: (modul_id, selesai, skor = null) => kirimProgres({ modul_id, selesai, skor }),
  latihan: (tingkat) => panggil('GET', `/api/latihan/${encodeURIComponent(tingkat)}`),
  hint: (soalId, n) => panggil('GET', `/api/hint/${encodeURIComponent(soalId)}/${n}`),
  periksa: (data) => panggil('POST', '/api/periksa', data),
  kuis: () => panggil('GET', '/api/kuis'),
  kirimKuis: (jawaban) => panggil('POST', '/api/kuis/kirim', { jawaban }),
};
