"""Membuat ikon PNG aplikasi tanpa library tambahan.

Gambar: kurva berbalik nilai (y = k/x) berwarna putih di atas latar biru,
dengan dua titik kuning di kurva.

Jalankan dari folder proyek:  python tools/buat_ikon.py
"""
import math
import os
import struct
import zlib

FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "icons")

BIRU = (47, 111, 222)
PUTIH = (255, 255, 255)
KUNING = (242, 201, 76)


def tulis_png(path, lebar, tinggi, piksel):
    def potongan(jenis, data):
        isi = jenis + data
        return struct.pack(">I", len(data)) + isi + struct.pack(">I", zlib.crc32(isi) & 0xFFFFFFFF)

    mentah = bytearray()
    for y in range(tinggi):
        mentah.append(0)
        for x in range(lebar):
            mentah.extend(piksel[y * lebar + x])
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(potongan(b"IHDR", struct.pack(">IIBBBBB", lebar, tinggi, 8, 6, 0, 0, 0)))
        f.write(potongan(b"IDAT", zlib.compress(bytes(mentah), 9)))
        f.write(potongan(b"IEND", b""))


def campur(bawah, atas, alfa):
    return tuple(round(b + (a - b) * alfa) for b, a in zip(bawah, atas))


def cakupan(jarak, tebal, piksel_per_unit):
    """Antialias: 1 di dalam garis, memudar 1 piksel di tepinya."""
    return max(0.0, min(1.0, (tebal - jarak) * piksel_per_unit + 0.5))


K = 0.12
U_AWAL, U_AKHIR = 0.16, 0.92
TITIK_KURVA = [(U_AWAL + (U_AKHIR - U_AWAL) * i / 120, K / (U_AWAL + (U_AKHIR - U_AWAL) * i / 120))
               for i in range(121)]


def jarak_ke_kurva(u, v):
    """Jarak terdekat titik (u, v) ke polyline kurva u·v = K (ujungnya membulat)."""
    terdekat = float("inf")
    for (x1, y1), (x2, y2) in zip(TITIK_KURVA, TITIK_KURVA[1:]):
        dx, dy = x2 - x1, y2 - y1
        t = max(0.0, min(1.0, ((u - x1) * dx + (v - y1) * dy) / (dx * dx + dy * dy)))
        terdekat = min(terdekat, math.hypot(u - x1 - t * dx, v - y1 - t * dy))
    return terdekat


def gambar(ukuran, area_aman, sudut_bulat):
    piksel = []
    titik = [(u, K / u) for u in (0.3, 0.6)]
    for py in range(ukuran):
        for px in range(ukuran):
            # Latar biru dengan sudut membulat (atau penuh untuk maskable)
            alfa_latar = 1.0
            if sudut_bulat:
                r = sudut_bulat * ukuran
                cx = min(max(px + 0.5, r), ukuran - r)
                cy = min(max(py + 0.5, r), ukuran - r)
                jarak_sudut = math.hypot(px + 0.5 - cx, py + 0.5 - cy)
                alfa_latar = max(0.0, min(1.0, r - jarak_sudut + 0.5))
            warna = BIRU

            # Koordinat konten (0..1) di dalam area aman, y ke atas
            tepi = (1 - area_aman) / 2
            u = ((px + 0.5) / ukuran - tepi) / area_aman
            v = 1 - ((py + 0.5) / ukuran - tepi) / area_aman
            ppu = ukuran * area_aman  # piksel per satuan konten
            tebal = 0.035

            # Sumbu
            if -0.05 <= u <= 1.0 and -0.05 <= v <= 1.0:
                if u <= 0.95:
                    warna = campur(warna, PUTIH, 0.55 * cakupan(abs(v), tebal / 2, ppu))
                if v <= 0.95:
                    warna = campur(warna, PUTIH, 0.55 * cakupan(abs(u), tebal / 2, ppu))

            # Kurva u·v = K. Saring dulu dengan perkiraan cepat, baru hitung jarak tepat.
            if 0.05 <= u <= 1.0 and 0.05 <= v <= 1.0:
                perkiraan = abs(u * v - K) / math.hypot(u, v)
                if perkiraan < tebal * 2:
                    warna = campur(warna, PUTIH, cakupan(jarak_ke_kurva(u, v), tebal, ppu))

            # Titik kuning
            for tu, tv in titik:
                warna = campur(warna, KUNING, cakupan(math.hypot(u - tu, v - tv), 0.065, ppu))

            piksel.append((*warna, round(255 * alfa_latar)))
    return piksel


def main():
    os.makedirs(FOLDER, exist_ok=True)
    daftar = [
        ("icon-192.png", 192, 0.72, 0.22),
        ("icon-512.png", 512, 0.72, 0.22),
        ("icon-maskable-512.png", 512, 0.56, 0),
        ("apple-touch-icon.png", 180, 0.66, 0),
    ]
    for nama, ukuran, area_aman, sudut in daftar:
        tulis_png(os.path.join(FOLDER, nama), ukuran, ukuran, gambar(ukuran, area_aman, sudut))
        print("dibuat", nama)


if __name__ == "__main__":
    main()
