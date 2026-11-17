"""Penyajian file statis dengan ETag berbasis ISI file.

Masalah yang diperbaiki: ETag bawaan Werkzeug = "mtime-ukuran-path". Di Vercel semua file
punya mtime yang sama (dibekukan saat build), sehingga file yang isinya berubah tetapi
ukurannya sama dianggap "tidak berubah" (304) dan browser/service worker terus memakai
versi lama. Di sini ETag dihitung dari hash isi file, dan Last-Modified diganti waktu
proses mulai (bukan tanggal build palsu).
"""
import hashlib
import os
import time
from functools import lru_cache

from flask import abort, send_from_directory
from werkzeug.security import safe_join

WAKTU_MULAI = time.time()


@lru_cache(maxsize=1024)
def etag_isi(path, mtime, ukuran):
    """Hash isi file (mtime & ukuran hanya kunci cache, bukan bagian ETag)."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for potongan in iter(lambda: f.read(65536), b""):
            h.update(potongan)
    return h.hexdigest()[:32]


def kirim_statis(folder, nama, mimetype=None, max_age=None):
    path = safe_join(folder, nama)
    if path is None or not os.path.isfile(path):
        abort(404)
    info = os.stat(path)
    return send_from_directory(
        folder, nama, mimetype=mimetype, max_age=max_age,
        etag=etag_isi(path, info.st_mtime, info.st_size),
        last_modified=WAKTU_MULAI,
    )
