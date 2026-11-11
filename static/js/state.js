// Data bersama: siswa yang login dan progres belajarnya.
import { api } from './api.js';
import { bacaLokal, hapusLokal, simpanLokal } from './util.js';

export const state = {
  siswa: bacaLokal('siswa-terakhir'),
  progres: bacaLokal('progres-terakhir', {}),
  kuisTerakhir: null,
  offline: false,
};

// Urutan belajar yang disarankan (EL04, DS02). Dipakai tombol "Mulai Belajar".
export const URUTAN = [
  { id: 'prasyarat', judul: 'Cek Prasyarat', rute: '#/materi/prasyarat' },
  { id: 'materi-1', judul: 'Pengertian Perbandingan Berbalik Nilai', rute: '#/materi/1' },
  { id: 'materi-2', judul: 'Ciri-Ciri Perbandingan Berbalik Nilai', rute: '#/materi/2' },
  { id: 'materi-3', judul: 'Hubungan Dua Besaran', rute: '#/materi/3' },
  { id: 'materi-4', judul: 'Tabel Perbandingan', rute: '#/materi/4' },
  { id: 'materi-5', judul: 'Rumus dan Penerapannya', rute: '#/materi/5' },
  { id: 'materi-6', judul: 'Perbedaan dengan Perbandingan Senilai', rute: '#/materi/6' },
  { id: 'contoh', judul: 'Contoh Soal', rute: '#/contoh' },
  { id: 'latihan-mudah', judul: 'Latihan Mudah', rute: '#/latihan/mudah' },
  { id: 'latihan-sedang', judul: 'Latihan Sedang', rute: '#/latihan/sedang' },
  { id: 'latihan-sulit', judul: 'Latihan Sulit', rute: '#/latihan/sulit' },
  { id: 'kuis', judul: 'Kuis', rute: '#/kuis' },
];

export const SKOR_MINIMAL_BUKA = 60;

export function setSiswa(siswa) {
  state.siswa = siswa;
  if (siswa) simpanLokal('siswa-terakhir', siswa);
  else {
    hapusLokal('siswa-terakhir');
    hapusLokal('progres-terakhir');
    state.progres = {};
    state.kuisTerakhir = null;
  }
}

export async function muatProgres() {
  const data = await api.progres();
  state.progres = Object.fromEntries(data.modul.map((m) => [m.modul_id, m]));
  state.kuisTerakhir = data.kuis_terakhir;
  simpanLokal('progres-terakhir', state.progres);
}

export function sudahSelesai(id) {
  return Boolean(state.progres[id]?.selesai);
}

export function skor(id) {
  return state.progres[id]?.skor ?? null;
}

export function tingkatTerbuka(tingkat) {
  if (tingkat === 'mudah') return true;
  const syarat = tingkat === 'sedang' ? 'latihan-mudah' : 'latihan-sedang';
  return (skor(syarat) ?? 0) >= SKOR_MINIMAL_BUKA;
}

/** Simpan progres ke server dan perbarui salinan lokal. */
export async function catatProgres(id, selesai, nilaiSkor = null) {
  const lama = state.progres[id] || {};
  state.progres[id] = {
    ...lama,
    modul_id: id,
    selesai: Boolean(lama.selesai) || selesai,
    skor: nilaiSkor == null ? lama.skor ?? null : Math.max(nilaiSkor, lama.skor ?? 0),
  };
  simpanLokal('progres-terakhir', state.progres);
  return api.simpanProgres(id, selesai, nilaiSkor);
}

export function langkahBerikutnya() {
  return URUTAN.find((l) => !sudahSelesai(l.id)) || URUTAN[URUTAN.length - 1];
}

export function persenSelesai() {
  const jumlah = URUTAN.filter((l) => sudahSelesai(l.id)).length;
  return Math.round((jumlah / URUTAN.length) * 100);
}

/** Total skor = rata-rata skor terbaik latihan & kuis yang sudah dikerjakan. */
export function totalSkor() {
  const daftar = ['latihan-mudah', 'latihan-sedang', 'latihan-sulit', 'kuis']
    .map(skor)
    .filter((s) => s != null);
  if (!daftar.length) return null;
  return Math.round(daftar.reduce((a, b) => a + b, 0) / daftar.length);
}
