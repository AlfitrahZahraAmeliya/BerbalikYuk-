// F12 — Panel "Tanya <nama pembimbing>": pembimbing AI berbasis Gemini (lewat server Flask).
// Prinsip CLT: terlipat secara bawaan, di layar yang sama (bukan pop-up), tombol cepat
// sesuai fase RMT agar siswa tidak perlu banyak mengetik, hanya 2 giliran terakhir terlihat.
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
  materi: ['Jelaskan dengan cara lain', 'Beri contoh sehari-hari', 'Aku belum paham bagian ini'],
};

/** Apakah pembimbing AI bisa dipakai sekarang? */
export function aiTersedia() {
  return Boolean(state.ai?.aktif) && !state.offline && navigator.onLine !== false;
}

export function namaPembimbing() {
  return state.ai?.nama || 'Kak Balik';
}

/**
 * Buat panel pembimbing.
 *  sumber        : 'latihan' | 'contoh' | 'materi'
 *  ref           : id soal / nomor contoh / "<materi>:<layar>"
 *  ambilFase     : () => 'input'|'elaborasi'|'output'|'refleksi'|null
 *  ambilKeadaan  : () => objek keadaan siswa (hubungan, isian_tabel, jawaban_terakhir, …)
 *  mode          : 'bimbing' | 'refleksi'
 *  judul         : teks tombol pembuka (opsional)
 *  saatBertanya  : callback setiap siswa mengirim pertanyaan (untuk menghitung bantuan)
 * Mengembalikan { el, buka, kirim, jumlahTanya } atau null jika AI tidak tersedia.
 */
export function panelPembimbing({
  sumber, ref, ambilFase = () => null, ambilKeadaan = () => ({}), mode = 'bimbing',
  judul = null, saatBertanya = () => {},
}) {
  if (!aiTersedia()) return null;
  const nama = namaPembimbing();
  const riwayat = [];
  let sedangMenunggu = false;
  let tampilSemua = false;

  const daftarPesan = h('div', { class: 'percakapan', 'aria-live': 'polite' });
  const tombolSebelumnya = h('button', {
    class: 'tombol-teks', type: 'button', hidden: true,
    onclick: () => { tampilSemua = true; gambarPercakapan(); },
  }, 'Lihat percakapan sebelumnya');
  const deretCepat = h('div', { class: 'deret-cepat' });
  const input = h('input', {
    class: 'input', type: 'text', maxlength: PANJANG_MAKS, autocomplete: 'off',
    placeholder: `Tulis pertanyaanmu untuk ${nama}…`, 'aria-label': `Pertanyaan untuk ${nama}`,
  });
  const tombolKirim = h('button', { class: 'tombol', type: 'submit', 'aria-label': 'Kirim', html: svgIkon('kirim') });
  const form = h('form', {
    class: 'form-tanya',
    onsubmit: (e) => { e.preventDefault(); kirim(input.value); },
  }, input, tombolKirim);

  const isi = h('div', { class: 'isi-pembimbing tumpuk', hidden: true },
    h('p', { class: 'teks-lemah teks-kecil' },
      mode === 'refleksi'
        ? `${nama} akan mengajakmu memikirkan kembali jawabanmu.`
        : `${nama} membantumu berpikir langkah demi langkah, bukan memberi jawaban.`),
    tombolSebelumnya,
    daftarPesan,
    deretCepat,
    form,
  );

  const tombolBuka = h('button', {
    class: 'tombol tombol-garis tombol-penuh tombol-pembimbing', type: 'button', 'aria-expanded': 'false',
    html: `${svgIkon('pesan')} <span>${judul || `Tanya ${nama}`}</span>`,
    onclick: () => (isi.hidden ? buka() : tutup()),
  });

  const el = h('section', { class: 'panel-pembimbing', 'aria-label': `Pembimbing ${nama}` }, tombolBuka, isi);

  function gambarCepat() {
    const kunci = sumber === 'materi' && !ambilFase() ? 'materi' : (ambilFase() || 'input');
    deretCepat.replaceChildren(...(PERTANYAAN_CEPAT[kunci] || PERTANYAAN_CEPAT.input).map((teks) =>
      h('button', { class: 'chip-tanya', type: 'button', disabled: sedangMenunggu, onclick: () => kirim(teks) }, teks)));
  }

  function gelembung(g) {
    return h('div', { class: `gelembung ${g.peran}${g.galat ? ' galat' : ''}` },
      g.peran === 'pembimbing' ? h('strong', {}, nama) : null,
      h('span', {}, g.teks),
      g.cadangan ? h('small', {}, 'Petunjuk dari bank soal') : null);
  }

  function gambarPercakapan() {
    const terlihat = tampilSemua ? riwayat : riwayat.slice(-GILIRAN_TERLIHAT);
    tombolSebelumnya.hidden = tampilSemua || riwayat.length <= GILIRAN_TERLIHAT;
    daftarPesan.replaceChildren(...terlihat.map(gelembung),
      sedangMenunggu ? h('div', { class: 'gelembung pembimbing menunggu' }, h('strong', {}, nama), h('span', {}, 'sedang berpikir…')) : '');
  }

  function buka() {
    isi.hidden = false;
    tombolBuka.setAttribute('aria-expanded', 'true');
    gambarCepat();
    gambarPercakapan();
  }

  function tutup() {
    isi.hidden = true;
    tombolBuka.setAttribute('aria-expanded', 'false');
  }

  async function kirim(teks) {
    const pesan = String(teks || '').trim().slice(0, PANJANG_MAKS);
    if (!pesan || sedangMenunggu) return;
    buka();
    const riwayatKirim = riwayat.filter((g) => !g.galat).slice(-6).map(({ peran, teks: t }) => ({ peran, teks: t }));
    riwayat.push({ peran: 'siswa', teks: pesan });
    input.value = '';
    sedangMenunggu = true;
    tombolKirim.disabled = true;
    saatBertanya();
    gambarPercakapan();
    gambarCepat();
    try {
      const r = await api.pembimbing({
        sumber, ref: String(ref), mode, fase: ambilFase(), keadaan: ambilKeadaan(), pesan, riwayat: riwayatKirim,
      });
      riwayat.push({ peran: 'pembimbing', teks: r.balasan, cadangan: r.cadangan || r.tersaring });
    } catch (galat) {
      riwayat.push({ peran: 'pembimbing', teks: galat.message, galat: true });
    }
    sedangMenunggu = false;
    tombolKirim.disabled = false;
    gambarPercakapan();
    gambarCepat();
    daftarPesan.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return {
    el, buka, tutup, kirim,
    jumlahTanya: () => riwayat.filter((g) => g.peran === 'siswa').length,
  };
}
