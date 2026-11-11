// F3–F6 — Daftar Materi dan layar materi satu per satu (segmentasi & pacing oleh siswa).
import { catatProgres, langkahBerikutnya, sudahSelesai } from '../state.js';
import { bacaAngka, formatAngka, h, samaAngka } from '../util.js';
import { svgIkon } from '../ikon.js';
import { kepala, panelHint, panelUmpanBalik, pesanGalat, progressBar, tombolLanjut } from '../komponen/umum.js';
import { tabelRumus } from '../komponen/tabel-rumus.js';
import { simulasi } from '../komponen/simulasi.js';

let cacheMateri = null;
export async function muatMateri() {
  if (!cacheMateri) {
    const r = await fetch('/static/data/materi.json');
    if (!r.ok) throw new Error('Materi gagal dimuat.');
    cacheMateri = await r.json();
  }
  return cacheMateri;
}

const ID_MATERI = ['prasyarat', '1', '2', '3', '4', '5', '6'];
const idModul = (id) => (id === 'prasyarat' ? 'prasyarat' : `materi-${id}`);
const kapital = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ---------- Daftar Materi ----------

function renderDaftar(wadah, materi) {
  const disarankan = langkahBerikutnya().id;
  wadah.append(h('div', { class: 'tumpuk-lebar' },
    kepala({ judul: 'Materi', kembali: '#/beranda' }),
    h('section', { class: 'kartu-header' },
      h('div', { class: 'tumpuk' },
        h('h1', {}, 'Perbandingan Berbalik Nilai'),
        h('p', {}, 'Mari pahami konsepnya secara bertahap!')),
      h('img', { src: '/static/img/pekerja.svg', alt: '' }),
    ),
    h('ul', { class: 'daftar-menu' }, ID_MATERI.map((id) => {
      const m = materi[id];
      const selesai = sudahSelesai(idModul(id));
      return h('li', {}, h('a', {
        class: `item-menu${disarankan === idModul(id) ? ' disarankan' : ''}`,
        href: `#/materi/${id}`,
      },
      h('span', { class: `nomor${selesai ? ' selesai' : ''}`, html: selesai ? svgIkon('centang') : (id === 'prasyarat' ? '0' : id) }),
      h('span', { class: 'judul-item' }, m.judul, h('small', {}, selesai ? 'Selesai' : m.ringkas)),
      h('span', { class: 'panah', html: svgIkon('panah') }),
      ));
    })),
  ));
}

// ---------- Jenis-jenis layar ----------

function layarTeks(l, siap) {
  siap();
  return h('div', { class: 'tumpuk-lebar' },
    l.kartuJudul ? h('div', { class: 'kartu-judul' }, h('h1', {}, l.kartuJudul)) : h('h2', {}, l.judul),
    h('div', { class: 'tumpuk', html: l.isi }),
    l.contoh
      ? h('div', { class: 'kartu-contoh' },
        h('div', {}, h('strong', {}, 'Contoh:'), h('p', {}, l.contoh)),
        l.gambar ? h('img', { src: l.gambar, alt: '' }) : null)
      : l.gambar ? h('img', { src: l.gambar, alt: '', class: 'gambar-tengah', width: 160 }) : null,
  );
}

function layarCiri(l, siap) {
  siap();
  return h('div', { class: 'tumpuk-lebar' },
    h('div', { class: 'kartu-judul' }, h('h1', {}, l.judul)),
    h('ul', { class: 'daftar-centang' }, l.daftar.map((d) => h('li', { html: svgIkon('centang') }, h('span', {}, d)))),
    h('div', { class: 'kotak-rumus' }, l.rumus),
  );
}

function layarTabel(l, siap) {
  siap();
  return h('div', { class: 'tumpuk-lebar' },
    h('h2', {}, l.judul),
    h('div', { html: l.isi }),
    h('table', { class: 'tabel-data' },
      h('thead', {}, h('tr', {}, l.kepala.map((k) => h('th', {}, k)))),
      h('tbody', {}, l.baris.map((b) => h('tr', {}, b.map((sel, i) => h('td', { class: i === l.sorotKolom ? 'sorot' : null }, sel))))),
    ),
    h('p', { class: 'kotak-kesimpulan' }, h('span', {}, l.catatan)),
  );
}

function layarPertanyaan(l, siap) {
  const slot = h('div');
  const tombol = l.opsi.map((teks, i) => h('button', {
    class: 'opsi', type: 'button', 'aria-pressed': 'false',
    onclick: () => {
      const benar = i === l.kunci;
      tombol.forEach((t) => t.classList.remove('salah'));
      tombol[i].classList.add(benar ? 'benar' : 'salah');
      if (benar) {
        tombol.forEach((t) => { t.disabled = true; });
        slot.replaceChildren(panelUmpanBalik(true, l.penjelasan));
        siap();
      } else {
        slot.replaceChildren(panelUmpanBalik(false, 'Coba pikirkan lagi: jika satu besaran bertambah, apa yang terjadi pada besaran lainnya?'));
      }
    },
  }, h('span', { class: 'huruf' }, String.fromCharCode(65 + i)), teks));
  return h('div', { class: 'tumpuk-lebar' },
    h('h2', {}, 'Ayo coba!'),
    h('p', { class: 'kartu' }, l.pertanyaan),
    h('div', { class: 'daftar-opsi' }, tombol),
    slot,
  );
}

function layarSusun(l, siap) {
  let chipTerpilih = null;
  const slot = h('div');
  const chip = l.angka.map((n) => h('button', {
    class: 'chip-angka', type: 'button', 'aria-pressed': 'false',
    onclick: () => {
      chipTerpilih = chipTerpilih === n ? null : n;
      chip.forEach((c, i) => {
        c.classList.toggle('terpilih', l.angka[i] === chipTerpilih);
        c.setAttribute('aria-pressed', String(l.angka[i] === chipTerpilih));
      });
    },
  }, n));

  const tabel = tabelRumus({
    label: l.label, ditanya: 'b2', mode: 'pilih',
    onPilihSel: (k) => {
      const isian = tabel.isian();
      if (isian[k] !== '') {               // ketuk kotak terisi = kosongkan
        tabel.setSel(k, '');
      } else if (chipTerpilih != null) {
        tabel.setSel(k, chipTerpilih);
        chipTerpilih = null;
      }
      const dipakai = Object.values(tabel.isian());
      chip.forEach((c, i) => {
        c.disabled = dipakai.includes(l.angka[i]);
        c.classList.remove('terpilih');
      });
      Object.values(tabel.sel).forEach((s) => s.classList.remove('benar', 'salah'));
      slot.replaceChildren();
    },
  });

  const periksa = h('button', {
    class: 'tombol tombol-penuh', type: 'button',
    onclick: () => {
      const isian = tabel.isian();
      let semuaBenar = true;
      for (const [k, target] of Object.entries(l.target)) {
        const benar = Number(isian[k]) === target;
        semuaBenar &&= benar;
        tabel.sel[k].classList.toggle('benar', benar);
        tabel.sel[k].classList.toggle('salah', !benar);
      }
      if (semuaBenar) {
        periksa.disabled = true;
        slot.replaceChildren(panelUmpanBalik(true, `Tepat! ${kapital(l.label.a)} di kolom a, ${l.label.b} di kolom b. Keadaan awal di baris 1.`));
        siap();
      } else {
        slot.replaceChildren(panelUmpanBalik(false, `Cek kotak yang merah. Kolom a = ${l.label.a}, kolom b = ${l.label.b}. Baris 1 = keadaan awal, baris 2 = keadaan baru.`));
      }
    },
  }, 'Periksa');

  return h('div', { class: 'tumpuk-lebar' },
    h('div', { class: 'kartu-soal' }, h('span', { class: 'label-chip' }, 'Soal:'), h('p', {}, l.soal)),
    h('p', { class: 'teks-lemah' }, 'Ketuk angka, lalu ketuk kotaknya.'),
    h('div', { class: 'deret-chip' }, chip),
    tabel.el,
    periksa,
    slot,
  );
}

function layarHitung(l, siap) {
  const slot = h('div');
  const tabel = tabelRumus({ label: l.label, ditanya: 'b2', nilai: l.nilai, mode: 'statis' });
  const input = h('input', { class: 'input', id: 'jawaban-hitung', inputmode: 'decimal', autocomplete: 'off' });
  let hintDibuka = false;
  const periksa = h('button', {
    class: 'tombol', type: 'button',
    onclick: () => {
      const n = bacaAngka(input.value);
      if (samaAngka(n, l.kunci)) {
        periksa.disabled = true;
        input.disabled = true;
        slot.replaceChildren(panelUmpanBalik(true, `Tepat! b₂ = ${formatAngka(l.kunci)} ${l.satuan}. Pekerja bertambah, hari berkurang.`));
        siap();
      } else {
        slot.replaceChildren(panelUmpanBalik(false, 'Belum tepat. Hitung dulu a₁ × b₁, lalu bagi dengan a₂.'));
      }
    },
  }, 'Periksa');
  const tombolHint = h('button', {
    class: 'tombol tombol-garis', type: 'button', html: `${svgIkon('lampu')} Petunjuk`,
    onclick: () => {
      if (hintDibuka) return;
      hintDibuka = true;
      tombolHint.after(panelHint(1, 1, l.petunjuk));
    },
  });
  return h('div', { class: 'tumpuk-lebar' },
    h('div', { class: 'kartu-soal' }, h('span', { class: 'label-chip' }, 'Coba hitung:'), h('p', {}, l.soal)),
    tabel.el,
    h('div', {},
      h('label', { for: 'jawaban-hitung', class: 'teks-lemah' }, 'b₂ ='),
      h('div', { class: 'input-jawaban' }, input, h('span', {}, l.satuan))),
    h('div', { class: 'baris-tombol' }, tombolHint, periksa),
    slot,
  );
}

function layarBanding(l, siap) {
  siap();
  const kartu = (k, warna) => h('div', { class: 'kartu tumpuk' },
    h('span', { class: `label-chip${warna ? '' : ' muda'}` }, k.judul),
    h('p', {}, h('strong', {}, k.arah)),
    h('p', {}, k.tetap),
    h('p', { class: 'teks-lemah' }, k.contoh),
  );
  return h('div', { class: 'tumpuk-lebar' },
    h('div', { class: 'kartu-judul' }, h('h1', {}, l.judul)),
    kartu(l.kiri, false),
    kartu(l.kanan, true),
  );
}

function layarKuisJenis(l, siap) {
  let i = 0;
  let benar = 0;
  const wadah = h('div', { class: 'tumpuk-lebar' });

  function gambar() {
    if (i >= l.soal.length) {
      siap();
      wadah.replaceChildren(
        h('div', { class: 'kartu-judul' }, h('h1', {}, `${benar} dari ${l.soal.length} benar`)),
        h('p', { class: 'tengah' }, benar >= 6
          ? 'Hebat! Kamu sudah bisa membedakan senilai dan berbalik nilai.'
          : 'Bagus! Ingat: berbalik nilai = satu naik, yang lain turun.'),
      );
      return;
    }
    const s = l.soal[i];
    const slot = h('div');
    const pilih = (jawab) => {
      const tepat = jawab === s.kunci;
      if (tepat) benar += 1;
      tombol.forEach((t) => { t.disabled = true; });
      tombol.find((t) => t.dataset.nilai === jawab).classList.add(tepat ? 'benar' : 'salah');
      slot.replaceChildren(
        panelUmpanBalik(tepat, `${s.alasan} → ${s.kunci === 'senilai' ? 'senilai' : 'berbalik nilai'}.`),
        h('div', { class: 'baris-tombol kanan' }, tombolLanjut(i + 1 < l.soal.length ? 'Berikutnya' : 'Lihat hasil', () => { i += 1; gambar(); })),
      );
    };
    const tombol = [['senilai', 'Senilai'], ['berbalik', 'Berbalik nilai']].map(([nilai, teks]) =>
      h('button', { class: 'opsi', type: 'button', 'data-nilai': nilai, onclick: () => pilih(nilai) }, teks));
    wadah.replaceChildren(
      h('div', { class: 'baris-progres' }, progressBar(i, l.soal.length), h('span', { class: 'angka' }, `${i + 1} / ${l.soal.length}`)),
      h('h2', {}, l.judul),
      h('p', { class: 'kartu-soal' }, `"${s.teks}"`),
      h('div', { class: 'dua-pilihan' }, tombol),
      slot,
    );
  }
  gambar();
  return wadah;
}

function layarPrasyarat(l, siap) {
  let i = 0;
  const salah = [];
  const wadah = h('div', { class: 'tumpuk-lebar' });

  function selesai() {
    const skor = Math.round(((l.soal.length - salah.length) / l.soal.length) * 100);
    catatProgres('prasyarat', true, skor).catch(() => {});
    siap();
    wadah.replaceChildren(
      h('div', { class: 'kartu-judul' }, h('h1', {}, `${l.soal.length - salah.length} dari ${l.soal.length} benar`)),
      salah.length
        ? h('div', { class: 'tumpuk' },
          h('p', {}, 'Tidak apa-apa! Ini kartu pengingat untukmu:'),
          salah.map((s) => h('div', { class: 'panel-hint' }, h('div', {}, h('small', {}, s.teks), s.pengingat))))
        : h('p', { class: 'tengah' }, 'Hebat! Kamu siap belajar perbandingan berbalik nilai.'),
    );
  }

  function gambar() {
    if (i >= l.soal.length) { selesai(); return; }
    const s = l.soal[i];
    const slot = h('div');
    const lanjut = () => { i += 1; gambar(); };
    const nilai = (jawab) => {
      const tepat = s.pilihan ? jawab === s.kunci : samaAngka(bacaAngka(jawab), s.kunci);
      if (!tepat) salah.push(s);
      slot.replaceChildren(
        panelUmpanBalik(tepat, tepat ? 'Mantap!' : `Jawabannya ${s.pilihan ? s.kunci : formatAngka(s.kunci)}. ${s.pengingat}`),
        h('div', { class: 'baris-tombol kanan' }, tombolLanjut(i + 1 < l.soal.length ? 'Berikutnya' : 'Lihat hasil', lanjut)),
      );
    };
    let isian;
    if (s.pilihan) {
      const tombol = s.pilihan.map((p) => h('button', {
        class: 'opsi', type: 'button',
        onclick: () => { tombol.forEach((t) => { t.disabled = true; }); nilai(p); },
      }, p));
      isian = h('div', { class: 'dua-pilihan' }, tombol);
    } else {
      const input = h('input', { class: 'input', inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Jawaban' });
      const kirim = h('button', {
        class: 'tombol', type: 'submit',
      }, 'Periksa');
      isian = h('form', {
        class: 'input-jawaban',
        onsubmit: (e) => {
          e.preventDefault();
          if (!input.value.trim()) return;
          input.disabled = true; kirim.disabled = true;
          nilai(input.value);
        },
      }, input, kirim);
      setTimeout(() => input.focus(), 0);
    }
    wadah.replaceChildren(
      h('div', { class: 'baris-progres' }, progressBar(i, l.soal.length), h('span', { class: 'angka' }, `${i + 1} / ${l.soal.length}`)),
      h('p', { class: 'kartu-soal' }, s.teks),
      isian,
      slot,
    );
  }
  gambar();
  return wadah;
}

const PERENDER = {
  teks: layarTeks, ciri: layarCiri, tabel: layarTabel, pertanyaan: layarPertanyaan,
  susun: layarSusun, hitung: layarHitung, banding: layarBanding,
  'kuis-jenis': layarKuisJenis, prasyarat: layarPrasyarat, simulasi,
};

// ---------- Halaman satu materi ----------

function renderSelesai(wadah, id, m) {
  const indeks = ID_MATERI.indexOf(id);
  const berikut = ID_MATERI[indeks + 1];
  wadah.append(h('div', { class: 'tumpuk-lebar tengah' },
    kepala({ judul: id === 'prasyarat' ? 'Cek Prasyarat' : `Materi ${id}`, kembali: '#/materi' }),
    h('img', { src: '/static/img/pekerja.svg', alt: '', width: 140, class: 'gambar-tengah' }),
    h('h1', {}, id === 'prasyarat' ? 'Pemanasan selesai!' : 'Materi selesai!'),
    h('p', {}, berikut ? 'Lanjut ke bagian berikutnya, ya.' : 'Semua materi selesai. Saatnya melihat contoh soal!'),
    berikut
      ? h('a', { class: 'tombol tombol-penuh', href: `#/materi/${berikut}` }, `Lanjut: ${cacheMateri[berikut].judul}`)
      : h('a', { class: 'tombol tombol-penuh', href: '#/contoh' }, 'Lihat Contoh Soal'),
    h('a', { class: 'tombol tombol-garis tombol-penuh', href: '#/materi' }, 'Daftar Materi'),
  ));
}

export async function render(wadah, params) {
  let materi;
  try {
    materi = await muatMateri();
  } catch {
    wadah.append(pesanGalat('Materi belum bisa dibuka. Sambungkan ke internet sekali untuk menyimpannya.', () => window.location.reload()));
    return;
  }

  if (!params.id) { renderDaftar(wadah, materi); return; }

  const id = params.id;
  const m = materi[id];
  if (!m) { window.location.hash = '#/materi'; return; }

  const total = m.layar.length;
  const idx = Math.min(Number(params.layar || 0), total);
  if (idx >= total) {
    catatProgres(idModul(id), true).catch(() => {});
    renderSelesai(wadah, id, m);
    return;
  }

  const lanjut = tombolLanjut(idx + 1 < total ? 'Lanjut' : 'Selesai', () => {
    window.location.hash = `#/materi/${id}/${idx + 1}`;
  }, { disabled: true });
  const siap = () => { lanjut.disabled = false; };
  const layar = PERENDER[m.layar[idx].tipe](m.layar[idx], siap);

  // Materi yang pernah selesai boleh dilewati tanpa menjawab ulang.
  if (sudahSelesai(idModul(id))) siap();

  wadah.append(h('div', { class: 'tumpuk-lebar' },
    kepala({ judul: id === 'prasyarat' ? 'Cek Prasyarat' : `Materi ${id}`, kembali: '#/materi', kanan: `${idx + 1} / ${total}` }),
    progressBar(idx + 1, total),
    layar,
    h('div', { class: 'baris-tombol' },
      idx > 0 ? h('a', { class: 'tombol tombol-garis', href: `#/materi/${id}/${idx - 1}` }, '← Kembali') : null,
      lanjut,
    ),
  ));
}
