// Ikon garis sederhana (inline SVG, satu warna mengikuti currentColor).

const GARIS = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const PATH = {
  kembali: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  rumah: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  grafik: '<path d="M5 20V12M12 20V5M19 20v-9"/>',
  gerigi: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  buku: '<path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2zM22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z"/>',
  lampu: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>',
  barbel: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  trofi: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>',
  panah: '<path d="M9 18l6-6-6-6"/>',
  centang: '<path d="M20 6L9 17l-5-5"/>',
  kunci: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  silang: '<path d="M18 6L6 18M6 6l12 12"/>',
  pasang: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  bagikan: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/>',
  tambah: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
  main: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
  keluar: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  seru: '<circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h.01"/>',
  bintang: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor"/>',
  ulang: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
  huruf: '<path d="M4 20l5-14h2l5 14M6.5 14h7M17 20v-6M20 17h-6"/>',
};

const ORANG = '<svg viewBox="0 0 26 32" aria-hidden="true"><circle cx="13" cy="6" r="5" fill="currentColor"/>'
  + '<path d="M7.5 3.5a5.5 5 0 0 1 11 0z" fill="#F2C94C"/>'
  + '<path d="M3 30v-8a8 8 0 0 1 8-8h4a8 8 0 0 1 8 8v8z" fill="currentColor"/></svg>';

/** Kembalikan string SVG (dipakai dengan prop html). */
export function svgIkon(nama) {
  if (nama === 'orang') return ORANG;
  return `<svg viewBox="0 0 24 24" ${GARIS} aria-hidden="true">${PATH[nama] || ''}</svg>`;
}

/** Kembalikan elemen SVG. */
export function ikon(nama) {
  const wadah = document.createElement('span');
  wadah.innerHTML = svgIkon(nama);
  return wadah.firstElementChild;
}
