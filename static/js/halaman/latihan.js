// F8 — Latihan bertahap: Mudah (pilihan ganda) → Sedang (isian + tabel) → Sulit (+ tandai informasi).
// Penilaian dilakukan di server (Python), jadi kunci jawaban tidak ada di HP.
import { api, GalatApi } from '../api.js';
import { catatProgres, muatProgres, skor, tingkatTerbuka } from '../state.js';
import { bacaAngka, denganSatuan, h } from '../util.js';
import { svgIkon } from '../ikon.js';
import {
  chipFase, faseRMT, kepala, panelHint, panelUmpanBalik, pesanGalat, progressBar, tombolLanjut,
} from '../komponen/umum.js';
import { aiTersedia, kakBalik, namaPembimbing } from '../komponen/pembimbing.js';
import { tabelRumus } from '../komponen/tabel-rumus.js';

const kapital = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const TINGKAT = [
  { id: 'mudah', judul: 'Mudah', keterangan: 'Pilihan ganda, angka langsung' },
  { id: 'sedang', judul: 'Sedang', keterangan: 'Isi tabel sendiri, soal cerita pendek' },
  { id: 'sulit', judul: 'Sulit', keterangan: 'Soal cerita panjang, tandai informasi penting' },
];

function pilihTingkat(aktif) {
  return h('nav', { class: 'pilih-tingkat', 'aria-label': 'Tingkat latihan' }, TINGKAT.map((t) => {
    if (!tingkatTerbuka(t.id)) {
      return h('span', { class: 'terkunci', html: `${svgIkon('kunci')} ${t.judul}`, 'aria-label': `${t.judul} (terkunci)` });
    }
    return h('a', {
      href: `#/latihan/${t.id}`, class: t.id === aktif ? 'aktif' : null,
      'aria-current': t.id === aktif ? 'page' : null,
    }, t.judul);
  }));
}

function renderPilihan(wadah) {
  kakBalik.atur({ sumber: 'umum', ref: 'latihan' });
  wadah.append(h('div', { class: 'tumpuk-lebar' },
    kepala({ judul: 'Latihan Soal', kembali: '#/beranda' }),
    h('p', { class: 'teks-lemah' }, 'Mulai dari Mudah. Tingkat berikutnya terbuka jika skormu minimal 60.'),
    h('ul', { class: 'daftar-menu' }, TINGKAT.map((t, i) => {
      const terbuka = tingkatTerbuka(t.id);
      const nilai = skor(`latihan-${t.id}`);
      return h('li', {}, h(terbuka ? 'a' : 'div', {
        class: 'item-menu', href: terbuka ? `#/latihan/${t.id}` : null, 'aria-disabled': terbuka ? null : 'true',
      },
      h('span', { class: `nomor${terbuka ? (nilai != null ? ' selesai' : '') : ' kunci'}`, html: terbuka ? String(i + 1) : svgIkon('kunci') }),
      h('span', { class: 'judul-item' }, t.judul,
        h('small', {}, nilai != null ? `Skor terbaik: ${nilai}` : terbuka ? t.keterangan : 'Terkunci')),
      terbuka ? h('span', { class: 'panah', html: svgIkon('panah') }) : null,
      ));
    })),
  ));
}

/** Pecah soal menjadi bagian kalimat yang bisa diketuk (titik dalam angka seperti 2.000 tidak dipecah). */
export function pecahKalimat(teks) {
  const hasil = [];
  const pola = /[.,?!](\s+|$)/g;
  let awal = 0;
  let m;
  while ((m = pola.exec(teks))) {
    hasil.push(teks.slice(awal, m.index + 1).trim());
    awal = m.index + m[0].length;
  }
  if (awal < teks.length) hasil.push(teks.slice(awal).trim());
  return hasil.filter(Boolean);
}

/** Mode tandai (EL05): siswa memberi label Diketahui/Ditanya pada bagian soal. */
function penandaSoal(teks, selesai) {
  const bagian = pecahKalimat(teks);
  const label = bagian.map(() => null);
  let mode = 'diketahui';
  const slot = h('div');

  const tombolMode = {
    diketahui: h('button', { type: 'button', class: 't-diketahui', 'aria-pressed': 'true', onclick: () => gantiMode('diketahui') }, 'Diketahui'),
    ditanya: h('button', { type: 'button', class: 't-ditanya', 'aria-pressed': 'false', onclick: () => gantiMode('ditanya') }, 'Ditanya'),
  };
  function gantiMode(baru) {
    mode = baru;
    Object.entries(tombolMode).forEach(([k, t]) => t.setAttribute('aria-pressed', String(k === mode)));
  }

  const tombolSelesai = h('button', { class: 'tombol tombol-penuh', type: 'button', disabled: true }, 'Selesai menandai');
  const segmen = bagian.map((b, i) => h('button', {
    type: 'button', class: 'segmen',
    onclick: (e) => {
      label[i] = label[i] === mode ? null : mode;
      e.currentTarget.className = `segmen${label[i] ? ` ${label[i]}` : ''}`;
      e.currentTarget.setAttribute('aria-label', `${b}${label[i] ? ` (${label[i]})` : ''}`);
      slot.replaceChildren();
      tombolSelesai.disabled = !(label.includes('diketahui') && label.includes('ditanya'));
    },
  }, b));

  tombolSelesai.addEventListener('click', () => {
    const iTanya = bagian.findIndex((b) => b.endsWith('?'));
    if (iTanya >= 0 && label[iTanya] !== 'ditanya') {
      slot.replaceChildren(panelUmpanBalik(false, 'Bagian yang ditanya biasanya kalimat yang diakhiri tanda tanya (?).'));
      return;
    }
    if (label.filter((l) => l === 'diketahui').length < 2) {
      slot.replaceChildren(panelUmpanBalik(false, 'Tandai minimal dua informasi yang diketahui (yang berisi angka penting).'));
      return;
    }
    segmen.forEach((s) => { s.disabled = true; });
    selesai();
  });

  return {
    kartu: h('div', { class: 'kartu-soal penanda' }, h('span', { class: 'label-chip' }, 'Soal:'), h('div', {}, segmen)),
    alat: h('div', { class: 'tumpuk' },
      h('p', { class: 'teks-lemah' }, 'Pilih jenis tanda, lalu ketuk bagian soal. Informasi yang tidak dipakai biarkan saja.'),
      h('div', { class: 'alat-tandai' }, tombolMode.diketahui, tombolMode.ditanya),
      slot,
      tombolSelesai),
  };
}

function renderSesi(wadah, tingkat, daftarSoal) {
  const hasilPertama = {};      // soal_id -> benar pada percobaan pertama?
  let i = 0;

  function ringkasan() {
    kakBalik.atur({ sumber: 'umum', ref: 'latihan' });
    const benar = Object.values(hasilPertama).filter(Boolean).length;
    const total = daftarSoal.length;
    const nilai = Math.round((benar / total) * 100);
    const iBerikut = TINGKAT.findIndex((t) => t.id === tingkat) + 1;
    const berikut = TINGKAT[iBerikut];
    const lolos = nilai >= 60;

    wadah.replaceChildren(h('div', { class: 'tumpuk-lebar' },
      kepala({ judul: 'Hasil Latihan', kembali: '#/latihan' }),
      h('div', { class: 'kartu tengah tumpuk' },
        h('p', { class: 'teks-lemah' }, `Latihan ${TINGKAT[iBerikut - 1].judul}`),
        h('p', { class: 'skor-besar' }, nilai, h('small', {}, ' / 100')),
        h('p', {}, `Benar pada percobaan pertama: ${benar} dari ${total} soal.`),
      ),
      h('ul', { class: 'daftar-centang kartu' }, daftarSoal.map((s, n) => h('li', {
        html: hasilPertama[s.id] ? svgIkon('centang') : svgIkon('ulang'),
      }, h('span', {}, `Soal ${n + 1}: ${hasilPertama[s.id] ? 'benar langsung' : 'perlu diulang'}`)))),
      h('p', { class: 'tengah' }, lolos
        ? (berikut ? `Hebat! Tingkat ${berikut.judul} sekarang terbuka.` : 'Hebat! Kamu siap mengerjakan Kuis.')
        : `Ayo ulangi sekali lagi. ${aiTersedia() ? `Tanya ${namaPembimbing()}` : 'Pakai Petunjuk'} jika bingung, ya.`),
      lolos && berikut ? h('a', { class: 'tombol tombol-penuh', href: `#/latihan/${berikut.id}` }, `Lanjut ke ${berikut.judul} →`) : null,
      lolos && !berikut ? h('a', { class: 'tombol tombol-penuh', href: '#/kuis' }, 'Kerjakan Kuis →') : null,
      h('button', { class: `tombol ${lolos ? 'tombol-garis ' : ''}tombol-penuh`, onclick: () => window.dispatchEvent(new HashChangeEvent('hashchange')) }, 'Ulangi Latihan'),
    ));

    const simpan = catatProgres(`latihan-${tingkat}`, true, nilai);
    simpan.then(() => muatProgres()).catch(() => {});
  }

  function renderSoal() {
    if (i >= daftarSoal.length) { ringkasan(); return; }
    const soal = daftarSoal[i];
    const mulai = Date.now();
    let percobaan = 0;
    let hintLevel = 0;
    let selesai = false;

    // ---- Fase RMT: Input → Elaborasi → Output → Refleksi ----
    let fase = soal.tingkat === 'sulit' ? 'input' : 'elaborasi';
    const penandaFase = faseRMT(fase);
    const setFase = (baru) => { fase = baru; penandaFase.set(baru); };

    // Keadaan siswa yang dikirim ke pembimbing AI (tanpa data pribadi).
    const keadaan = { jawaban_terakhir: null, jenis_kesalahan: null };
    let keadaanTambahan = () => ({});
    const ambilKeadaan = () => ({ ...keadaan, percobaan, ...keadaanTambahan() });

    const slotUmpanBalik = h('div', { class: 'tumpuk' });
    const slotHint = h('div', { class: 'tumpuk' });
    const tombolCek = h('button', { class: 'tombol', type: 'button', disabled: true }, 'Cek Jawaban');
    const tombolHint = h('button', { class: 'tombol tombol-garis', type: 'button', html: `${svgIkon('lampu')} Petunjuk` });

    // Satu pintu bantuan: tombol melayang Kak Balik jika AI aktif, petunjuk statis jika tidak.
    const konteksSoal = {
      sumber: 'latihan', ref: soal.id, ambilFase: () => fase, ambilKeadaan,
      saatBertanya: () => { hintLevel = Math.min(3, hintLevel + 1); },
    };
    kakBalik.atur(konteksSoal);
    const adaAI = aiTersedia();
    const aksiAwal = () => (adaAI ? [tombolCek] : [tombolHint, tombolCek]);
    const barisAksi = h('div', { class: 'baris-tombol' }, ...aksiAwal());

    tombolHint.addEventListener('click', async () => {
      if (hintLevel >= soal.jumlah_hint) return;
      tombolHint.disabled = true;
      try {
        const r = await api.hint(soal.id, hintLevel + 1);
        hintLevel = r.n;
        slotHint.append(panelHint(r.n, r.total, r.hint));
      } catch (galat) {
        slotHint.append(panelUmpanBalik(false, galat.message));
      }
      tombolHint.disabled = hintLevel >= soal.jumlah_hint;
      tombolHint.innerHTML = `${svgIkon('lampu')} Petunjuk ${Math.min(hintLevel + 1, soal.jumlah_hint)}/${soal.jumlah_hint}`;
    });

    const lanjut = () => { i += 1; renderSoal(); window.scrollTo(0, 0); };
    const tombolBerikut = () => tombolLanjut(i + 1 < daftarSoal.length ? 'Soal berikutnya' : 'Lihat hasil', lanjut);

    function setelahValidasi() {
      setFase('refleksi');
      if (adaAI) {
        // Refleksi (metakognisi & transendensi) lewat lembar Kak Balik yang sama, mode refleksi.
        const konteksRefleksi = { ...konteksSoal, mode: 'refleksi', ambilFase: () => 'refleksi' };
        kakBalik.atur(konteksRefleksi);
        slotUmpanBalik.append(h('button', {
          class: 'tombol tombol-garis tombol-penuh', type: 'button', html: svgIkon('pesan'),
          onclick: () => kakBalik.buka(konteksRefleksi),
        }, ` Refleksi bersama ${namaPembimbing()} (boleh dilewati)`));
      }
      barisAksi.replaceChildren(tombolBerikut());
    }

    /** Fase Output — Validasi: siswa memeriksa kewajaran lewat arah hubungan (bukan coba-coba). */
    function validasi(arah) {
      const kata = (naik) => (naik ? 'bertambah' : 'berkurang');
      const awal = `${kapital(arah.berubah)} ${kata(arah.naik)}, ${arah.dicari}`;
      const pilihan = [
        { teks: `${awal} ${kata(arah.dicari_naik)}`, benar: true },
        { teks: `${awal} ${kata(!arah.dicari_naik)}`, benar: false },
      ].sort(() => Math.random() - 0.5);
      const slot = h('div');
      const tombol = pilihan.map((p) => h('button', {
        class: 'opsi', type: 'button',
        onclick: (e) => {
          if (p.benar) {
            tombol.forEach((t) => { t.disabled = true; });
            e.currentTarget.classList.add('benar');
            slot.replaceChildren(panelUmpanBalik(true, 'Tepat! Arah perubahannya sesuai, jadi jawabanmu masuk akal.'));
            setelahValidasi();
          } else {
            e.currentTarget.classList.add('salah');
            slot.replaceChildren(panelUmpanBalik(false, 'Lihat lagi tabelmu: dari baris 1 ke baris 2, angkanya naik atau turun?'));
          }
        },
      }, p.teks));
      return h('div', { class: 'kartu tumpuk' },
        h('h3', {}, chipFase('output'), ' Validasi: mengapa jawabanmu masuk akal?'),
        h('div', { class: 'daftar-opsi' }, tombol),
        slot);
    }

    async function cek(dataJawaban, setelah) {
      percobaan += 1;
      tombolCek.disabled = true;
      try {
        const r = await api.periksa({
          soal_id: soal.id, ...dataJawaban, hint_level: hintLevel, percobaan,
          durasi_detik: Math.round((Date.now() - mulai) / 1000),
        });
        keadaan.jawaban_terakhir = dataJawaban.jawaban;
        keadaan.jenis_kesalahan = r.jenis_kesalahan;
        if (!(soal.id in hasilPertama)) hasilPertama[soal.id] = r.benar;
        slotUmpanBalik.replaceChildren(panelUmpanBalik(r.benar, r.pesan, r.pembahasan || null));
        setelah(r);
        if (r.benar) {
          selesai = true;
          setFase('output');
          barisAksi.replaceChildren();
          if (r.arah) slotUmpanBalik.append(validasi(r.arah));
          else setelahValidasi();
        } else if (r.pembahasan) {
          barisAksi.replaceChildren(
            h('button', { class: 'tombol tombol-garis', type: 'button', onclick: () => { tombolCek.disabled = false; barisAksi.replaceChildren(...aksiAwal()); } }, 'Coba lagi'),
            tombolBerikut(),
          );
        } else {
          tombolCek.disabled = false;
        }
        // Eliminasi coba-coba (RMT): setelah 2 kali salah, ajak berpikir bersama, bukan menebak.
        if (!r.benar && percobaan >= 2 && adaAI) {
          slotUmpanBalik.append(h('div', { class: 'tumpuk' },
            h('p', { class: 'teks-kecil teks-lemah' }, `Daripada menebak, yuk pikirkan bersama ${namaPembimbing()}.`),
            h('button', {
              class: 'tombol tombol-garis tombol-penuh', type: 'button', html: svgIkon('pesan'),
              onclick: () => kakBalik.buka(),
            }, ` Tanya ${namaPembimbing()}`)));
        }
        slotUmpanBalik.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (galat) {
        percobaan -= 1;
        tombolCek.disabled = false;
        slotUmpanBalik.replaceChildren(panelUmpanBalik(false, galat.message));
      }
    }

    const isi = h('div', { class: 'tumpuk-lebar' });
    let kartuSoal = h('div', { class: 'kartu-soal' }, h('span', { class: 'label-chip' }, 'Soal:'), h('p', {}, soal.teks));

    if (soal.tipe === 'pilihan_ganda') {
      let dipilih = null;
      const opsi = soal.opsi.map((nilai, n) => h('button', {
        class: 'opsi', type: 'button', 'aria-pressed': 'false',
        onclick: (e) => {
          if (selesai) return;
          dipilih = nilai;
          opsi.forEach((o) => o.setAttribute('aria-pressed', String(o === e.currentTarget)));
          tombolCek.disabled = false;
        },
      }, h('span', { class: 'huruf' }, String.fromCharCode(65 + n)), denganSatuan(nilai, soal.satuan)));
      tombolCek.addEventListener('click', () => cek({ jawaban: dipilih }, (r) => {
        const terpilih = opsi.find((o) => o.getAttribute('aria-pressed') === 'true');
        terpilih.classList.add(r.benar ? 'benar' : 'salah');
        if (r.benar) opsi.forEach((o) => { o.disabled = true; });
        else { terpilih.disabled = true; terpilih.setAttribute('aria-pressed', 'false'); dipilih = null; tombolCek.disabled = true; }
      }));
      isi.append(h('div', { class: 'daftar-opsi' }, opsi));
    } else {
      // Isian: Elaborasi (hubungan → tabel/representasi → rumus/manipulasi) lalu Output (jawaban).
      let hubungan = null;
      const tabel = tabelRumus({ label: soal.label, ditanya: soal.ditanya, mode: 'input', onUbah: () => perbaruiCek() });
      keadaanTambahan = () => ({ hubungan, isian_tabel: tabel.isian() });
      const inputJawaban = h('input', { class: 'input', id: 'jawaban', inputmode: 'decimal', autocomplete: 'off', oninput: () => perbaruiCek() });
      const pilihanHubungan = [['senilai', 'Senilai'], ['berbalik', 'Berbalik nilai']].map(([nilai, teks]) => h('button', {
        class: 'opsi', type: 'button', 'aria-pressed': 'false',
        onclick: (e) => {
          hubungan = nilai;
          pilihanHubungan.forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
          tabel.setHubungan(nilai);
          perbaruiCek();
        },
      }, teks));

      function perbaruiCek() {
        tombolCek.disabled = selesai || !(hubungan && tabel.terisiSemua() && bacaAngka(inputJawaban.value) != null);
        if (!selesai && fase !== 'input') setFase(hubungan && tabel.terisiSemua() ? 'output' : 'elaborasi');
      }

      tombolCek.addEventListener('click', () => cek({
        jawaban: inputJawaban.value, isian_tabel: tabel.isian(), hubungan,
      }, (r) => {
        if (r.benar) {
          inputJawaban.disabled = true;
          inputJawaban.classList.add('benar');
          Object.values(tabel.sel).forEach((s) => { s.disabled = true; });
        }
      }));

      const satuan = soal.satuan === 'rupiah' ? 'rupiah' : soal.satuan;
      const langkahIsian = h('div', { class: 'tumpuk-lebar' },
        h('div', { class: 'tumpuk' }, h('h3', {}, chipFase('elaborasi'), ' 1. Tentukan hubungan'),
          h('p', { class: 'teks-lemah teks-kecil' }, `Jika ${soal.label.a} bertambah, ${soal.label.b} bertambah atau berkurang?`),
          h('div', { class: 'dua-pilihan' }, pilihanHubungan)),
        h('div', { class: 'tumpuk' }, h('h3', {}, chipFase('elaborasi'), ' 2. Isi tabel, lihat rumusnya'), tabel.el),
        h('div', { class: 'tumpuk' }, h('label', { for: 'jawaban' }, h('h3', {}, chipFase('output'), ' 3. Jawaban')),
          h('div', { class: 'input-jawaban' },
            soal.satuan === 'rupiah' ? h('span', {}, 'Rp') : null,
            inputJawaban,
            soal.satuan === 'rupiah' ? null : h('span', {}, satuan))),
      );

      if (soal.tingkat === 'sulit') {
        const penanda = penandaSoal(soal.teks, () => {
          penanda.alat.replaceWith(langkahIsian);
          barisAksi.hidden = false;
          setFase('elaborasi');
        });
        kartuSoal = penanda.kartu;
        barisAksi.hidden = true;
        isi.append(h('div', { class: 'tumpuk' }, h('h3', {}, chipFase('input'), ' Langkah awal: tandai informasi'), penanda.alat));
      } else {
        isi.append(langkahIsian);
      }
    }

    wadah.replaceChildren(h('div', { class: 'tumpuk-lebar' },
      kepala({ judul: 'Latihan Soal', kembali: '#/latihan', kanan: `${i + 1} / ${daftarSoal.length}` }),
      pilihTingkat(tingkat),
      progressBar(i + 1, daftarSoal.length),
      kartuSoal,
      penandaFase.el,
      isi,
      slotHint,
      slotUmpanBalik,
      barisAksi,
    ));
  }

  renderSoal();
}

export async function render(wadah, params) {
  const tingkat = params.tingkat;
  if (!tingkat || !TINGKAT.some((t) => t.id === tingkat)) { renderPilihan(wadah); return; }

  wadah.append(h('p', { class: 'memuat' }, 'Menyiapkan soal…'));
  try {
    const data = await api.latihan(tingkat);
    renderSesi(wadah, tingkat, data.soal);
  } catch (galat) {
    kakBalik.atur({ sumber: 'umum', ref: 'latihan' });
    wadah.replaceChildren(h('div', { class: 'tumpuk-lebar' },
      kepala({ judul: 'Latihan Soal', kembali: '#/latihan' }),
      pesanGalat(galat.message, galat instanceof GalatApi && galat.status === 403 ? null : () => window.location.reload()),
      galat instanceof GalatApi && galat.status === 403
        ? h('a', { class: 'tombol tombol-penuh', href: '#/latihan' }, 'Pilih tingkat lain') : null,
    ));
  }
}
