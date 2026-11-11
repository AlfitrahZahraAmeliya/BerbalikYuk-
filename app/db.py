"""Akses database.

Ada dua penyimpanan dengan fungsi yang sama:
- SupabaseRepo : dipakai jika SUPABASE_URL dan SUPABASE_SERVICE_KEY diisi (produksi).
- SqliteRepo   : dipakai jika tidak diisi (pengembangan lokal & pengujian).

Kode lain cukup memanggil get_repo() tanpa peduli penyimpanan mana yang aktif.
Setiap fungsi yang menyangkut data siswa WAJIB menerima siswa_id.
"""
import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone

from flask import current_app


def _sekarang():
    return datetime.now(timezone.utc).isoformat()


class SupabaseRepo:
    def __init__(self, url, key):
        from supabase import create_client

        self.klien = create_client(url, key)

    def _tabel(self, nama):
        return self.klien.table(nama)

    def cari_siswa_username(self, username):
        data = self._tabel("siswa").select("*").eq("username", username).limit(1).execute().data
        return data[0] if data else None

    def ambil_siswa(self, siswa_id):
        data = self._tabel("siswa").select("*").eq("id", siswa_id).limit(1).execute().data
        return data[0] if data else None

    def buat_siswa(self, username, nama, kelas, password_hash):
        baris = {"username": username, "nama": nama, "kelas": kelas, "password_hash": password_hash}
        return self._tabel("siswa").insert(baris).execute().data[0]

    def daftar_progres(self, siswa_id):
        return (
            self._tabel("progress")
            .select("modul_id,selesai,skor,hint_dipakai,updated_at")
            .eq("siswa_id", siswa_id)
            .execute()
            .data
        )

    def ambil_progres(self, siswa_id, modul_id):
        data = (
            self._tabel("progress").select("*").eq("siswa_id", siswa_id).eq("modul_id", modul_id)
            .limit(1).execute().data
        )
        return data[0] if data else None

    def tulis_progres(self, baris):
        baris = {**baris, "updated_at": _sekarang()}
        self._tabel("progress").upsert(baris, on_conflict="siswa_id,modul_id").execute()

    def simpan_attempt(self, baris):
        self._tabel("attempts").insert(baris).execute()

    def simpan_kuis(self, siswa_id, skor, skor_per_tp):
        self._tabel("kuis_hasil").insert(
            {"siswa_id": siswa_id, "skor": skor, "skor_per_tp": skor_per_tp}
        ).execute()

    def kuis_terakhir(self, siswa_id):
        data = (
            self._tabel("kuis_hasil").select("skor,skor_per_tp,created_at").eq("siswa_id", siswa_id)
            .order("created_at", desc=True).limit(1).execute().data
        )
        return data[0] if data else None


SKEMA_SQLITE = """
create table if not exists siswa (
  id text primary key, username text unique not null, nama text not null,
  kelas text not null, password_hash text not null, created_at text);
create table if not exists progress (
  siswa_id text not null, modul_id text not null, selesai integer default 0,
  skor integer, hint_dipakai integer default 0, updated_at text,
  primary key (siswa_id, modul_id));
create table if not exists attempts (
  id integer primary key autoincrement, siswa_id text, modul_id text, soal_id text,
  jawaban text, benar integer, jenis_kesalahan text, hint_level integer,
  durasi_detik integer, created_at text);
create table if not exists kuis_hasil (
  id integer primary key autoincrement, siswa_id text, skor integer,
  skor_per_tp text, created_at text);
"""


class SqliteRepo:
    def __init__(self, path):
        folder = os.path.dirname(path)
        if folder:
            os.makedirs(folder, exist_ok=True)
        self.path = path
        with self._koneksi() as kon:
            kon.executescript(SKEMA_SQLITE)

    def _koneksi(self):
        kon = sqlite3.connect(self.path)
        kon.row_factory = sqlite3.Row
        return kon

    def _satu(self, sql, parameter):
        with self._koneksi() as kon:
            baris = kon.execute(sql, parameter).fetchone()
        return dict(baris) if baris else None

    def cari_siswa_username(self, username):
        return self._satu("select * from siswa where username = ?", (username,))

    def ambil_siswa(self, siswa_id):
        return self._satu("select * from siswa where id = ?", (siswa_id,))

    def buat_siswa(self, username, nama, kelas, password_hash):
        baris = {
            "id": str(uuid.uuid4()), "username": username, "nama": nama, "kelas": kelas,
            "password_hash": password_hash, "created_at": _sekarang(),
        }
        with self._koneksi() as kon:
            kon.execute(
                "insert into siswa values (:id,:username,:nama,:kelas,:password_hash,:created_at)", baris
            )
        return baris

    @staticmethod
    def _progres_dict(baris):
        hasil = dict(baris)
        hasil["selesai"] = bool(hasil["selesai"])
        hasil.pop("siswa_id", None)
        return hasil

    def daftar_progres(self, siswa_id):
        with self._koneksi() as kon:
            semua = kon.execute("select * from progress where siswa_id = ?", (siswa_id,)).fetchall()
        return [self._progres_dict(b) for b in semua]

    def ambil_progres(self, siswa_id, modul_id):
        baris = self._satu(
            "select * from progress where siswa_id = ? and modul_id = ?", (siswa_id, modul_id)
        )
        return self._progres_dict(baris) if baris else None

    def tulis_progres(self, baris):
        baris = {**baris, "selesai": int(bool(baris.get("selesai"))), "updated_at": _sekarang()}
        with self._koneksi() as kon:
            kon.execute(
                """insert into progress (siswa_id, modul_id, selesai, skor, hint_dipakai, updated_at)
                   values (:siswa_id, :modul_id, :selesai, :skor, :hint_dipakai, :updated_at)
                   on conflict (siswa_id, modul_id) do update set
                     selesai = excluded.selesai, skor = excluded.skor,
                     hint_dipakai = excluded.hint_dipakai, updated_at = excluded.updated_at""",
                baris,
            )

    def simpan_attempt(self, baris):
        baris = {**baris, "benar": int(baris["benar"]), "created_at": _sekarang()}
        with self._koneksi() as kon:
            kon.execute(
                """insert into attempts (siswa_id, modul_id, soal_id, jawaban, benar,
                   jenis_kesalahan, hint_level, durasi_detik, created_at)
                   values (:siswa_id, :modul_id, :soal_id, :jawaban, :benar,
                   :jenis_kesalahan, :hint_level, :durasi_detik, :created_at)""",
                baris,
            )

    def simpan_kuis(self, siswa_id, skor, skor_per_tp):
        with self._koneksi() as kon:
            kon.execute(
                "insert into kuis_hasil (siswa_id, skor, skor_per_tp, created_at) values (?,?,?,?)",
                (siswa_id, skor, json.dumps(skor_per_tp), _sekarang()),
            )

    def kuis_terakhir(self, siswa_id):
        baris = self._satu(
            "select skor, skor_per_tp, created_at from kuis_hasil where siswa_id = ? "
            "order by id desc limit 1",
            (siswa_id,),
        )
        if baris:
            baris["skor_per_tp"] = json.loads(baris["skor_per_tp"] or "{}")
        return baris


def buat_repo(config, instance_path):
    if config.get("SUPABASE_URL") and config.get("SUPABASE_SERVICE_KEY"):
        return SupabaseRepo(config["SUPABASE_URL"], config["SUPABASE_SERVICE_KEY"])
    path = config.get("SQLITE_PATH") or os.path.join(instance_path, "berbalikyuk.db")
    return SqliteRepo(path)


def get_repo():
    return current_app.extensions["repo"]


# ---- Logika progres bersama (tidak bergantung jenis penyimpanan) ----

def simpan_progres(siswa_id, modul_id, selesai=False, skor=None):
    """Upsert progres. Status selesai tidak bisa kembali ke False; skor disimpan yang terbaik."""
    repo = get_repo()
    lama = repo.ambil_progres(siswa_id, modul_id) or {}
    skor_lama = lama.get("skor")
    if skor is None:
        skor_baru = skor_lama
    elif skor_lama is None:
        skor_baru = skor
    else:
        skor_baru = max(skor, skor_lama)
    repo.tulis_progres({
        "siswa_id": siswa_id,
        "modul_id": modul_id,
        "selesai": bool(lama.get("selesai")) or bool(selesai),
        "skor": skor_baru,
        "hint_dipakai": lama.get("hint_dipakai") or 0,
    })


def tambah_hint(siswa_id, modul_id):
    repo = get_repo()
    lama = repo.ambil_progres(siswa_id, modul_id) or {}
    repo.tulis_progres({
        "siswa_id": siswa_id,
        "modul_id": modul_id,
        "selesai": bool(lama.get("selesai")),
        "skor": lama.get("skor"),
        "hint_dipakai": (lama.get("hint_dipakai") or 0) + 1,
    })
