// F1 — Masuk & Daftar (tanpa email; username + kata sandi).
import { api } from '../api.js';
import { muatProgres, setSiswa } from '../state.js';
import { h } from '../util.js';

function bidang(label, props) {
  const id = `bidang-${props.name}`;
  return h('div', { class: 'bidang' },
    h('label', { for: id }, label),
    h('input', { class: 'input', id, ...props }),
  );
}

function logo() {
  return h('div', { class: 'tengah tumpuk' },
    h('div', { class: 'judul-app judul-tengah' },
      h('img', { src: '/static/icons/icon-192.png', alt: '' }),
      'BerbalikYuk!'),
    h('p', { class: 'teks-lemah' }, 'Belajar perbandingan berbalik nilai, pelan-pelan.'),
  );
}

async function setelahMasuk(siswa) {
  setSiswa(siswa);
  try { await muatProgres(); } catch { /* progres dimuat ulang di beranda */ }
  window.location.hash = '#/beranda';
}

export function render(wadah, params) {
  const modeDaftar = params.mode === 'daftar';
  const pesan = h('p', { class: 'pesan-galat', role: 'alert' });
  const tombolKirim = h('button', { class: 'tombol tombol-penuh', type: 'submit' },
    modeDaftar ? 'Daftar' : 'Masuk');

  const form = h('form', {
    class: 'formulir kartu tumpuk-lebar',
    novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      pesan.textContent = '';
      const data = Object.fromEntries(new FormData(form));
      tombolKirim.disabled = true;
      try {
        const siswa = modeDaftar ? await api.daftar(data) : await api.masuk(data.username, data.sandi);
        await setelahMasuk(siswa);
      } catch (galat) {
        pesan.textContent = galat.message;
        tombolKirim.disabled = false;
      }
    },
  },
  h('h2', {}, modeDaftar ? 'Buat akun baru' : 'Masuk'),
  h('div', {},
    modeDaftar ? bidang('Nama panggilan', { name: 'nama', autocomplete: 'nickname', maxlength: 40, required: true }) : null,
    modeDaftar ? bidang('Kelas', { name: 'kelas', placeholder: 'Contoh: 7A', maxlength: 10, required: true }) : null,
    bidang('Username', {
      name: 'username', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false',
      maxlength: 20, required: true, placeholder: modeDaftar ? 'huruf kecil/angka, 3–20 karakter' : null,
    }),
    bidang('Kata sandi', {
      name: 'sandi', type: 'password', autocomplete: modeDaftar ? 'new-password' : 'current-password',
      minlength: 6, required: true, placeholder: modeDaftar ? 'minimal 6 karakter' : null,
    }),
  ),
  pesan,
  tombolKirim,
  h('p', { class: 'tengah' },
    modeDaftar ? 'Sudah punya akun? ' : 'Belum punya akun? ',
    h('a', { href: modeDaftar ? '#/masuk' : '#/daftar' }, modeDaftar ? 'Masuk' : 'Daftar'),
  ));

  wadah.append(h('div', { class: 'tumpuk-lebar' }, logo(), form,
    modeDaftar ? h('p', { class: 'teks-lemah teks-kecil tengah' },
      'Ingat username dan kata sandimu, ya. Kami tidak meminta email.') : null,
  ));
  form.querySelector('input').focus();
}
