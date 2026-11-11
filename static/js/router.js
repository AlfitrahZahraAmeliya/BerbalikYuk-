// Router berbasis hash (#/beranda, #/materi/3/1, …). Tombol "kembali" di HP ikut berfungsi.

let daftarRute = [];
let bersihkanSebelumnya = null;
let opsi = {};

/**
 * rute: [{ pola: '/materi/:id/:layar?', halaman: modul, publik?: bool, nav?: 'beranda' }]
 * opsi: { wadah, sudahLogin: () => bool, setelahRender: (rute) => void }
 */
export function mulaiRouter(rute, pengaturan) {
  daftarRute = rute.map((r) => ({ ...r, regex: polaKeRegex(r.pola) }));
  opsi = pengaturan;
  window.addEventListener('hashchange', jalankan);
  jalankan();
}

function polaKeRegex(pola) {
  const nama = [];
  const sumber = pola.split('/').map((bagian) => {
    if (!bagian.startsWith(':')) return bagian.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const opsional = bagian.endsWith('?');
    nama.push(bagian.slice(1).replace('?', ''));
    return opsional ? '?([^/]*)' : '([^/]+)';
  }).join('/');
  return { re: new RegExp(`^${sumber}/?$`), nama };
}

function cocokkan(path) {
  for (const r of daftarRute) {
    const m = path.match(r.regex.re);
    if (m) {
      const params = {};
      r.regex.nama.forEach((n, i) => { if (m[i + 1]) params[n] = decodeURIComponent(m[i + 1]); });
      return { rute: r, params };
    }
  }
  return null;
}

export async function jalankan() {
  const path = (window.location.hash || '#/beranda').slice(1);
  const hasil = cocokkan(path);
  if (!hasil) { window.location.replace('#/beranda'); return; }

  const { rute, params } = hasil;
  if (!rute.publik && !opsi.sudahLogin()) { window.location.replace('#/masuk'); return; }
  if (rute.hanyaTamu && opsi.sudahLogin()) { window.location.replace('#/beranda'); return; }

  if (typeof bersihkanSebelumnya === 'function') bersihkanSebelumnya();
  bersihkanSebelumnya = null;

  const { wadah } = opsi;
  wadah.replaceChildren();
  window.scrollTo(0, 0);
  opsi.sebelumRender?.(rute);
  try {
    bersihkanSebelumnya = await rute.halaman(wadah, params);
  } catch (galat) {
    console.error(galat);
    wadah.textContent = 'Maaf, halaman ini gagal dibuka. Coba muat ulang.';
  }
  wadah.focus({ preventScroll: true });
}
