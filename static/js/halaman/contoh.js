// F7 — Contoh soal bertahap (worked example → fading). Langkah dibuka dengan tombol Lanjut.
import { catatProgres, sudahSelesai } from '../state.js';
import { bacaAngka, h, samaAngka } from '../util.js';
import { svgIkon } from '../ikon.js';
import { kepala, panelHint, panelUmpanBalik, pesanGalat, tombolLanjut } from '../komponen/umum.js';

let cacheContoh = null;
async function muatContoh() {
  if (!cacheContoh) {
    const r = await fetch('/static/data/contoh.json');
    if (!r.ok) throw new Error('gagal');
    cacheContoh = await r.json();
  }
  return cacheContoh;
}

function renderDaftar(wadah, daftar) {
  wadah.append(h('div', { class: 'tumpuk-lebar' },
    kepala({ judul: 'Contoh Soal', kembali: '#/beranda' }),
    h('p', { class: 'teks-lemah' }, 'Pelajari contoh langkah demi langkah. Ketuk Lanjut jika sudah paham.'),
    h('ul', { class: 'daftar-menu' }, daftar.map((c, i) => h('li', {},
      h('a', { class: 'item-menu', href: `#/contoh/${i + 1}` },
        h('span', { class: 'nomor' }, i + 1),
        h('span', { class: 'judul-item' }, c.judul, h('small', {}, c.keterangan)),
        h('span', { class: 'panah', html: svgIkon('panah') }),
      )))),
    sudahSelesai('contoh') ? h('a', { class: 'tombol tombol-penuh', href: '#/latihan/mudah' }, 'Lanjut ke Latihan') : null,
  ));
}

/** Isian pada langkah yang dipudarkan. Memanggil beres() setelah dijawab benar. */
function isianLangkah(isian, beres) {
  const slot = h('div');
  let hintTampil = false;
  const salah = () => {
    slot.replaceChildren(panelUmpanBalik(false, 'Belum tepat, coba lagi.'));
    if (!hintTampil) {
      hintTampil = true;
      slot.append(panelHint(1, 1, isian.petunjuk));
    }
  };

  if (isian.tipe === 'pilihan') {
    const tombol = isian.opsi.map((o) => h('button', {
      class: 'opsi', type: 'button',
      onclick: () => {
        if (o === isian.kunci) {
          tombol.forEach((t) => { t.disabled = true; });
          tombol.find((t) => t.textContent === o).classList.add('benar');
          slot.replaceChildren(panelUmpanBalik(true, 'Tepat! Masuk akal.'));
          beres();
        } else {
          tombol.find((t) => t.textContent === o).classList.add('salah');
          salah();
        }
      },
    }, o));
    return h('div', { class: 'tumpuk' }, h('div', { class: 'dua-pilihan' }, tombol), slot);
  }

  const input = h('input', { class: 'input', inputmode: 'decimal', autocomplete: 'off', 'aria-label': isian.label });
  const kirim = h('button', { class: 'tombol', type: 'submit' }, 'Periksa');
  const form = h('form', {
    class: 'input-jawaban',
    onsubmit: (e) => {
      e.preventDefault();
      if (samaAngka(bacaAngka(input.value), isian.kunci)) {
        input.disabled = true; kirim.disabled = true;
        input.classList.add('benar');
        slot.replaceChildren(panelUmpanBalik(true, 'Tepat!'));
        beres();
      } else {
        salah();
      }
    },
  }, h('span', {}, `${isian.label} =`), input, isian.satuan ? h('span', {}, isian.satuan) : null, kirim);
  return h('div', { class: 'tumpuk' }, form, slot);
}

function renderContoh(wadah, daftar, n) {
  const c = daftar[n - 1];
  let terbuka = 0;
  const daftarLangkah = h('div', { class: 'tumpuk-lebar' });
  const aksi = h('div', { class: 'baris-tombol kanan' });

  function selesaiSemua() {
    const terakhir = n === daftar.length;
    if (terakhir) catatProgres('contoh', true).catch(() => {});
    aksi.replaceChildren(terakhir
      ? h('a', { class: 'tombol', href: '#/latihan/mudah' }, 'Mulai Latihan →')
      : h('a', { class: 'tombol', href: `#/contoh/${n + 1}` }, 'Contoh berikutnya →'));
  }

  function bukaLangkah() {
    const l = c.langkah[terbuka];
    terbuka += 1;
    const tombol = tombolLanjut('Lanjut', () => bukaLangkah());
    const beres = () => {
      if (terbuka < c.langkah.length) aksi.replaceChildren(tombol);
      else selesaiSemua();
    };

    const isi = h('div', { class: 'langkah-isi' },
      h('h3', {}, `${l.judul}:`),
      h('div', { html: l.isi }),
    );
    const langkahEl = h('div', { class: 'langkah langkah-baru' }, h('span', { class: 'nomor' }, terbuka), isi);

    const tampilKesimpulan = () => {
      if (l.kesimpulan) {
        isi.append(h('div', { class: 'kotak-kesimpulan' },
          h('span', {}, l.kesimpulan),
          h('span', { class: 'centang-bulat', html: svgIkon('centang') })));
      }
    };

    if (l.isian) {
      aksi.replaceChildren();
      isi.append(isianLangkah(l.isian, () => { tampilKesimpulan(); beres(); }));
    } else {
      tampilKesimpulan();
      beres();
    }
    daftarLangkah.append(langkahEl);
    if (terbuka > 1) langkahEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  wadah.append(h('div', { class: 'tumpuk-lebar' },
    kepala({ judul: 'Contoh Soal', kembali: '#/contoh', kanan: `${n} / ${daftar.length}` }),
    h('div', { class: 'kartu-soal' }, h('span', { class: 'label-chip' }, 'Soal:'), h('p', {}, c.soal)),
    h('span', { class: 'label-chip muda' }, 'Pembahasan:'),
    daftarLangkah,
    aksi,
  ));
  bukaLangkah();
}

export async function render(wadah, params) {
  let daftar;
  try {
    daftar = await muatContoh();
  } catch {
    wadah.append(pesanGalat('Contoh soal belum bisa dibuka. Sambungkan ke internet sekali untuk menyimpannya.'));
    return;
  }
  const n = Number(params.n);
  if (!n || n < 1 || n > daftar.length) { renderDaftar(wadah, daftar); return; }
  renderContoh(wadah, daftar, n);
}
