// F12 — Kak Balik: SATU komponen pembimbing AI untuk seluruh aplikasi.
//
// Bentuk: tombol melayang (floating) + lembar chat dari bawah (maks ±60% layar) agar kartu
// soal yang menempel di atas tetap terlihat (kontiguitas, EL02). Halaman hanya menetapkan
// KONTEKS lewat kakBalik.atur(...); router mengosongkannya setiap pindah halaman (whitelist),
// dan rute yang dilarang (Kuis) tidak pernah menampilkan Kak Balik.
//
// Prinsip CLT & RMT di UI: tombol cepat sesuai fase (tidak perlu banyak mengetik), hanya
// 2 giliran terakhir terlihat, dan setiap balasan menonjolkan "Giliranmu" agar siswa tetap aktif.
import { api } from '../api.js';
import { state } from '../state.js';
import { h } from '../util.js';
import { svgIkon } from '../ikon.js';

const PANJANG_MAKS = 300;
const GILIRAN_TERLIHAT = 4; // 2 pertanyaan + 2 balasan

// Pertanyaan cepat per fase RMT.
const PERTANYAAN_CEPAT = {
  input: ['Aku bingung mulai dari mana', 'Apa saja yang diketahui?', 'Apa yang ditanyakan?'],
  elaborasi: ['Ini senilai atau berbalik nilai?', 'Angka mana yang jadi a₂?', 'Bagaimana memakai rumusnya?'],
  output: ['Apakah jawabanku masuk akal?', 'Cek langkahku, dong', 'Satuannya apa?'],
  refleksi: ['Mengapa jawabanku masuk akal?', 'Di mana lagi ada hubungan seperti ini?'],
  materi: ['Apa maksud bagian ini?', 'Beri contoh sehari-hari', 'Mengapa bisa begitu?'],
  umum: ['Perbandingan berbalik nilai itu apa?', 'Bedanya dengan senilai apa?', 'Beri contoh sehari-hari'],
};

/** Apakah pembimbing AI bisa dipakai sekarang? */
export function aiTersedia() {
  return Boolean(state.ai?.aktif) && !state.offline && navigator.onLine !== false;
}

export function namaPembimbing() {
  return state.ai?.nama || 'Kak Balik';
}

// ---------------------------------------------------------------------------
// Keadaan komponen tunggal
// ---------------------------------------------------------------------------
const kb = {
  konteks: null,          // { sumber, ref, mode, ambilFase, ambilKeadaan, saatBertanya }
  dilarang: false,        // rute terlarang (Kuis)
  riwayat: new Map(),     // kunci konteks → daftar giliran
  menunggu: false,
  tampilSemua: false,
  el: null,
};

const kunciKonteks = (k) => `${k.sumber}:${k.ref}:${k.mode || 'bimbing'}`;

function riwayatAktif() {
  const kunci = kunciKonteks(kb.konteks);
  if (!kb.riwayat.has(kunci)) kb.riwayat.set(kunci, []);
  return kb.riwayat.get(kunci);
}

function faseAktif() {
  return kb.konteks?.ambilFase?.() || null;
}

// ---------------------------------------------------------------------------
// DOM (dibuat sekali)
// ---------------------------------------------------------------------------
function buatDom() {
  const nama = namaPembimbing();
  const fab = h('button', {
    class: 'kak-balik-fab', type: 'button', hidden: true,
    'aria-label': `Tanya ${nama}`, 'aria-haspopup': 'dialog', 'aria-expanded': 'false',
    html: `${svgIkon('pesan')}<span>${nama}</span>`,
    onclick: () => kakBalik.buka(),
  });

  const judul = h('strong', {}, nama);
  const keterangan = h('p', { class: 'teks-lemah teks-kecil' });
  const tombolTutup = h('button', {
    class: 'tombol-ikon', type: 'button', 'aria-label': `Tutup ${nama}`, html: svgIkon('silang'),
    onclick: () => kakBalik.tutup(),
  });
  const tombolSebelumnya = h('button', {
    class: 'tombol-teks', type: 'button', hidden: true,
    onclick: () => { kb.tampilSemua = true; gambarPercakapan(); },
  }, 'Lihat percakapan sebelumnya');
  const daftarPesan = h('div', { class: 'percakapan', 'aria-live': 'polite' });
  const deretCepat = h('div', { class: 'deret-cepat' });
  const input = h('input', {
    class: 'input', type: 'text', maxlength: PANJANG_MAKS, autocomplete: 'off',
    placeholder: `Tulis jawaban atau pertanyaanmu…`, 'aria-label': `Pesan untuk ${nama}`,
  });
  const tombolKirim = h('button', { class: 'tombol', type: 'submit', 'aria-label': 'Kirim', html: svgIkon('kirim') });
  const form = h('form', {
    class: 'form-tanya',
    onsubmit: (e) => { e.preventDefault(); kirim(input.value); },
  }, input, tombolKirim);

  const isi = h('div', { class: 'isi-lembar tumpuk' }, keterangan, tombolSebelumnya, daftarPesan, deretCepat);
  const lembar = h('section', {
    class: 'lembar-kak-balik', role: 'dialog', 'aria-modal': 'false', 'aria-label': `Pembimbing ${nama}`, hidden: true,
    onkeydown: (e) => { if (e.key === 'Escape') kakBalik.tutup(); },
  },
  h('header', { class: 'kepala-lembar' },
    h('span', { class: 'nomor', html: svgIkon('pesan') }),
    h('div', {}, judul, h('small', {}, 'Pembimbing berpikir, bukan pemberi jawaban')),
    tombolTutup),
  isi,
  form);

  document.body.append(fab, lembar);
  kb.el = { fab, lembar, isi, keterangan, tombolSebelumnya, daftarPesan, deretCepat, input, tombolKirim };

  window.addEventListener('online', perbaruiTampilan);
  window.addEventListener('ai-berubah', perbaruiTampilan);
  window.addEventListener('offline', () => { kakBalik.tutup(); perbaruiTampilan(); });
}

function perbaruiTampilan() {
  if (!kb.el) return;
  const boleh = Boolean(kb.konteks) && !kb.dilarang && aiTersedia();
  const terbuka = !kb.el.lembar.hidden;
  // tanpaFab: konteks dibuka dari kartu (Beranda) — tidak ada tombol melayang di halaman itu.
  const adaFab = boleh && !kb.konteks.tanpaFab;
  kb.el.fab.hidden = !adaFab || terbuka;
  document.body.classList.toggle('ada-fab', adaFab);
  if (!boleh && terbuka) kakBalik.tutup();
}

function gambarCepat() {
  const fase = faseAktif();
  const kunci = fase || (kb.konteks?.sumber === 'umum' ? 'umum' : 'materi');
  kb.el.deretCepat.replaceChildren(...(PERTANYAAN_CEPAT[kunci] || PERTANYAAN_CEPAT.umum).map((teks) =>
    h('button', { class: 'chip-tanya', type: 'button', disabled: kb.menunggu, onclick: () => kirim(teks) }, teks)));
}

function gelembung(g) {
  const nama = namaPembimbing();
  return h('div', { class: `gelembung ${g.peran}${g.galat ? ' galat' : ''}` },
    g.peran === 'pembimbing' ? h('strong', {}, nama) : null,
    h('span', {}, g.teks),
    g.giliran ? h('div', { class: 'giliran-siswa' }, h('b', {}, 'Giliranmu: '), g.giliran) : null,
    g.cadangan ? h('small', {}, 'Petunjuk dari bank soal') : null);
}

function gambarPercakapan() {
  const riwayat = riwayatAktif();
  const terlihat = kb.tampilSemua ? riwayat : riwayat.slice(-GILIRAN_TERLIHAT);
  kb.el.tombolSebelumnya.hidden = kb.tampilSemua || riwayat.length <= GILIRAN_TERLIHAT;
  const nama = namaPembimbing();
  kb.el.daftarPesan.replaceChildren(...terlihat.map(gelembung),
    kb.menunggu ? h('div', { class: 'gelembung pembimbing menunggu' }, h('strong', {}, nama), h('span', {}, 'sedang berpikir…')) : '');
  kb.el.keterangan.textContent = kb.konteks?.mode === 'refleksi'
    ? `${nama} akan mengajakmu memikirkan kembali cara berpikirmu.`
    : `${nama} membantumu berpikir langkah demi langkah. Jawab "Giliranmu" agar kamu menemukan sendiri.`;
}

async function kirim(teks) {
  const pesan = String(teks || '').trim().slice(0, PANJANG_MAKS);
  if (!pesan || kb.menunggu || !kb.konteks) return;
  const konteks = kb.konteks;
  const riwayat = riwayatAktif();
  // Riwayat untuk server: teks lengkap + metadata mediasi (tahap, penilaian, representasi).
  const riwayatKirim = riwayat.filter((g) => !g.galat).slice(-8).map((g) => ({
    peran: g.peran,
    teks: g.giliran ? `${g.teks}\nGiliranmu: ${g.giliran}` : g.teks,
    ...(g.meta ? { meta: g.meta } : {}),
  }));
  riwayat.push({ peran: 'siswa', teks: pesan });
  kb.el.input.value = '';
  kb.menunggu = true;
  kb.el.tombolKirim.disabled = true;
  konteks.saatBertanya?.();
  gambarPercakapan();
  gambarCepat();
  try {
    const r = await api.pembimbing({
      sumber: konteks.sumber, ref: String(konteks.ref), mode: konteks.mode || 'bimbing',
      fase: faseAktif(), keadaan: konteks.ambilKeadaan?.() || {}, pesan, riwayat: riwayatKirim,
    });
    riwayat.push({
      peran: 'pembimbing', teks: r.balasan, giliran: r.giliran_siswa || '',
      meta: r.meta, cadangan: r.cadangan || r.tersaring,
    });
  } catch (galat) {
    riwayat.push({ peran: 'pembimbing', teks: galat.message, galat: true });
  }
  kb.menunggu = false;
  kb.el.tombolKirim.disabled = false;
  if (kb.konteks === konteks) {
    gambarPercakapan();
    gambarCepat();
    kb.el.daftarPesan.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ---------------------------------------------------------------------------
// API publik
// ---------------------------------------------------------------------------
export const kakBalik = {
  /** Dipanggil sekali saat aplikasi dimulai. */
  pasang() {
    if (!kb.el) buatDom();
  },

  /** Tetapkan konteks halaman (menampilkan tombol melayang), atau null untuk menyembunyikan. */
  atur(konteks) {
    if (!kb.el) buatDom();
    if (kb.dilarang) konteks = null;
    kb.konteks = konteks ? { mode: 'bimbing', ...konteks } : null;
    kb.tampilSemua = false;
    perbaruiTampilan();
    if (kb.konteks && !kb.el.lembar.hidden) { gambarPercakapan(); gambarCepat(); }
  },

  /** Rute terlarang (Kuis): Kak Balik tidak boleh tampil sama sekali. */
  larang(dilarang) {
    kb.dilarang = Boolean(dilarang);
    if (kb.dilarang) this.atur(null);
  },

  /** Buka lembar chat. konteksBaru (opsional) mengganti konteks, mis. mode refleksi atau sumber umum. */
  buka(konteksBaru = null) {
    if (!kb.el) buatDom();
    if (kb.dilarang || !aiTersedia()) return;
    if (konteksBaru) kb.konteks = { mode: 'bimbing', ...(kb.konteks || {}), ...konteksBaru };
    if (!kb.konteks) return;
    kb.el.lembar.hidden = false;
    kb.el.fab.setAttribute('aria-expanded', 'true');
    document.body.classList.add('lembar-terbuka');
    perbaruiTampilan();
    gambarPercakapan();
    gambarCepat();
    kb.el.input.focus({ preventScroll: true });
  },

  tutup() {
    if (!kb.el || kb.el.lembar.hidden) return;
    kb.el.lembar.hidden = true;
    kb.el.fab.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('lembar-terbuka');
    perbaruiTampilan();
    if (!kb.el.fab.hidden) kb.el.fab.focus({ preventScroll: true });
  },

  /** Hapus semua percakapan halaman (dipanggil router saat pindah halaman). */
  reset() {
    kb.riwayat.clear();
    this.tutup();
  },

  sedangTerbuka: () => Boolean(kb.el && !kb.el.lembar.hidden),
};
