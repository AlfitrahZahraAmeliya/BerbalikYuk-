// Simulasi Materi 3: geser jumlah pekerja, lihat jumlah hari berubah, hasil kali tetap (IL01).
import { h } from '../util.js';
import { svgIkon } from '../ikon.js';

export function simulasi({ total, nilai, awal }, siap) {
  const dicoba = new Set();
  const output = h('output', { for: 'slider-pekerja' });
  const barisan = h('div', { class: 'barisan-orang', 'aria-hidden': 'true' });
  const hasil = h('p', { class: 'hasil-simulasi', 'aria-live': 'polite' });
  const wadahTabel = h('div');
  const catatan = h('p', { class: 'teks-lemah' }, 'Coba geser ke beberapa angka berbeda.');

  const slider = h('input', {
    id: 'slider-pekerja', type: 'range', min: 0, max: nilai.length - 1, step: 1,
    value: Math.max(0, nilai.indexOf(awal)),
    'aria-label': 'Jumlah pekerja',
    oninput: perbarui,
  });

  function gambarTabel() {
    const baris = [...dicoba].sort((a, b) => a - b).slice(-5);
    const tampilKali = dicoba.size >= 3;
    wadahTabel.replaceChildren(h('table', { class: 'tabel-data' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Pekerja'), h('th', {}, 'Hari'), tampilKali ? h('th', {}, 'Pekerja × Hari') : null)),
      h('tbody', {}, baris.map((p) => h('tr', {},
        h('td', {}, p), h('td', {}, total / p),
        tampilKali ? h('td', { class: 'sorot' }, total) : null,
      ))),
    ));
    if (tampilKali) {
      catatan.replaceChildren(h('strong', {}, `💡 Hasil kalinya selalu ${total}. `), 'Pekerja naik, hari turun.');
      siap();
    } else {
      catatan.textContent = `Coba geser ke ${3 - dicoba.size} angka lain lagi.`;
    }
  }

  function perbarui() {
    const pekerja = nilai[Number(slider.value)];
    const hari = total / pekerja;
    output.textContent = pekerja;
    slider.setAttribute('aria-valuetext', `${pekerja} pekerja, ${hari} hari`);
    barisan.innerHTML = svgIkon('orang').repeat(pekerja);
    hasil.replaceChildren('Waktu selesai: ', h('span', {}, hari), ' hari');
    dicoba.add(pekerja);
    gambarTabel();
  }

  perbarui();

  return h('div', { class: 'tumpuk-lebar' },
    h('h2', {}, 'Geser untuk mengubah jumlah pekerja'),
    h('div', { class: 'kartu tumpuk' },
      h('div', { class: 'slider-baris' }, h('label', { for: 'slider-pekerja' }, 'Pekerja'), slider, output),
      barisan,
      hasil,
    ),
    wadahTabel,
    catatan,
  );
}
