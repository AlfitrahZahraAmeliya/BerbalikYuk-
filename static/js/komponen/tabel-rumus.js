// Tabel perbandingan berlabel + kotak rumus yang terisi otomatis di layar yang sama
// (kontiguitas spasial, EL02; mencegah angka tertukar, IL02).
import { bacaAngka, formatAngka, h } from '../util.js';

export const NAMA_SEL = { a1: 'a₁', b1: 'b₁', a2: 'a₂', b2: 'b₂' };
const KUNCI = ['a1', 'b1', 'a2', 'b2'];

function kapital(teks) {
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

/**
 * mode:
 *  - 'input'  : sel berupa kotak isian (Latihan Sedang/Sulit, Materi 5)
 *  - 'statis' : sel sudah terisi (contoh)
 *  - 'pilih'  : sel berupa tombol; isi lewat setSel() (Materi 4, ketuk angka lalu ketuk kotak)
 */
export function tabelRumus({
  label, ditanya = 'b2', nilai = {}, mode = 'input', hubungan = 'berbalik', onUbah = () => {}, onPilihSel = () => {},
}) {
  const isian = Object.fromEntries(KUNCI.map((k) => [k, nilai[k] ?? '']));
  const sel = {};
  let hubunganAktif = hubungan;

  const barisRumus = h('span');
  const barisIsi = h('span', { class: 'baris-isi' });
  const kotakRumus = h('div', { class: 'kotak-rumus', 'aria-live': 'polite' }, barisRumus, barisIsi);

  function tampil(k) {
    if (k === ditanya) return NAMA_SEL[k];
    const n = bacaAngka(isian[k]);
    return n == null ? NAMA_SEL[k] : formatAngka(n);
  }

  function perbaruiRumus() {
    const operator = hubunganAktif === 'senilai' ? ':' : '×';
    barisRumus.textContent = `a₁ ${operator} b₁ = a₂ ${operator} b₂`;
    barisIsi.textContent = `${tampil('a1')} ${operator} ${tampil('b1')} = ${tampil('a2')} ${operator} ${tampil('b2')}`;
  }

  function buatSel(k) {
    const labelSel = h('span', { class: 'label-sel' }, NAMA_SEL[k]);
    let el;
    if (k === ditanya) {
      el = h('div', { class: 'sel ditanya', 'aria-label': `${NAMA_SEL[k]}, yang ditanya` }, '?');
    } else if (mode === 'input') {
      el = h('input', {
        class: 'sel', inputmode: 'decimal', autocomplete: 'off',
        'aria-label': `${NAMA_SEL[k]} (${k.startsWith('a') ? label.a : label.b}, ${k.endsWith('1') ? 'awal' : 'baru'})`,
        value: isian[k],
        oninput: (e) => {
          isian[k] = e.target.value;
          e.target.classList.toggle('terisi', e.target.value !== '');
          e.target.classList.remove('benar', 'salah');
          perbaruiRumus();
          onUbah({ ...isian });
        },
      });
    } else if (mode === 'pilih') {
      el = h('button', {
        class: 'sel', type: 'button', 'aria-label': `Kotak ${NAMA_SEL[k]}`,
        onclick: () => onPilihSel(k),
      }, isian[k] === '' ? '' : formatAngka(isian[k]));
    } else {
      el = h('div', { class: 'sel terisi' }, isian[k] === '' ? '' : formatAngka(isian[k]));
    }
    sel[k] = el;
    return h('div', { class: 'pembungkus-sel' }, k === ditanya || mode !== 'input' ? null : labelSel, el);
  }

  const tabel = h('table', { class: 'tabel-perbandingan' },
    h('thead', {}, h('tr', {},
      h('th', {}, ''),
      h('th', { scope: 'col' }, `${kapital(label.a)} (a)`),
      h('th', { scope: 'col' }, `${kapital(label.b)} (b)`),
    )),
    h('tbody', {},
      h('tr', {}, h('th', { scope: 'row' }, 'Awal (1)'), h('td', {}, buatSel('a1')), h('td', {}, buatSel('b1'))),
      h('tr', {}, h('th', { scope: 'row' }, 'Baru (2)'), h('td', {}, buatSel('a2')), h('td', {}, buatSel('b2'))),
    ),
  );

  perbaruiRumus();

  return {
    el: h('div', { class: 'tumpuk' }, tabel, kotakRumus),
    tabel,
    kotakRumus,
    sel,
    isian: () => ({ ...isian }),
    setHubungan(baru) {
      hubunganAktif = baru;
      perbaruiRumus();
    },
    setSel(k, nilaiBaru) {
      isian[k] = nilaiBaru;
      if (sel[k] && mode !== 'input') {
        sel[k].textContent = nilaiBaru === '' ? '' : formatAngka(nilaiBaru);
        sel[k].classList.toggle('terisi', nilaiBaru !== '');
      }
      perbaruiRumus();
      onUbah({ ...isian });
    },
    terisiSemua() {
      return KUNCI.filter((k) => k !== ditanya).every((k) => bacaAngka(isian[k]) != null);
    },
  };
}
