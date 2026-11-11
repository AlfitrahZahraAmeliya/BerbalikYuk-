// Helper kecil pembuat elemen DOM dan format angka.

/**
 * Membuat elemen: h('button', { class: 'tombol', onclick: fn }, 'Teks').
 * Prop `html` memakai innerHTML — HANYA untuk konten tepercaya dari static/data/*.json
 * atau ikon bawaan. Teks dari server/siswa selalu lewat anak (textContent).
 */
export function h(tag, props = {}, ...anak) {
  const el = document.createElement(tag);
  for (const [kunci, nilai] of Object.entries(props || {})) {
    if (nilai == null || nilai === false) continue;
    if (kunci === 'class') el.className = nilai;
    else if (kunci === 'html') el.innerHTML = nilai;
    else if (kunci.startsWith('on') && typeof nilai === 'function') el.addEventListener(kunci.slice(2), nilai);
    else if (kunci === 'value') el.value = nilai;
    else el.setAttribute(kunci, nilai === true ? '' : nilai);
  }
  tambahAnak(el, anak);
  return el;
}

export function tambahAnak(el, anak) {
  for (const a of anak.flat(Infinity)) {
    if (a == null || a === false) continue;
    el.append(a instanceof Node ? a : document.createTextNode(String(a)));
  }
  return el;
}

/** Format angka gaya Indonesia: 22.5 -> "22,5", 20000 -> "20.000". */
export function formatAngka(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return String(x ?? '');
  return n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

/** Angka + satuan, misalnya "9 hari" atau "Rp20.000". */
export function denganSatuan(x, satuan) {
  if (satuan === 'rupiah') return `Rp${formatAngka(x)}`;
  return satuan ? `${formatAngka(x)} ${satuan}` : formatAngka(x);
}

/** Baca angka dari input siswa (menerima koma atau titik). */
export function bacaAngka(teks) {
  if (teks == null) return null;
  let s = String(teks).trim().toLowerCase().replace(/\s|rp/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function samaAngka(a, b) {
  return a != null && b != null && Math.abs(a - b) < 0.01;
}

const elToast = () => document.getElementById('toast');
let timerToast;
/** Pesan singkat di bawah layar. aksi (opsional) dijalankan saat toast diketuk. */
export function toast(pesan, aksi) {
  const el = elToast();
  clearTimeout(timerToast);
  el.textContent = pesan;
  el.hidden = false;
  el.onclick = aksi ? () => { el.hidden = true; aksi(); } : () => { el.hidden = true; };
  el.style.cursor = aksi ? 'pointer' : 'default';
  if (!aksi) timerToast = setTimeout(() => { el.hidden = true; }, 3500);
}

export function simpanLokal(kunci, nilai) {
  try { localStorage.setItem(kunci, JSON.stringify(nilai)); } catch { /* penyimpanan diblokir */ }
}

export function bacaLokal(kunci, bawaan = null) {
  try {
    const v = localStorage.getItem(kunci);
    return v == null ? bawaan : JSON.parse(v);
  } catch { return bawaan; }
}

export function hapusLokal(kunci) {
  try { localStorage.removeItem(kunci); } catch { /* abaikan */ }
}
