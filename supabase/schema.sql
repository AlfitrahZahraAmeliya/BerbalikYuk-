-- Skema database BerbalikYuk!
-- Jalankan seluruh isi file ini di Supabase: SQL Editor -> New query -> Run.

create table if not exists public.siswa (
  id             uuid primary key default gen_random_uuid(),
  username       text unique not null,
  nama           text not null,
  kelas          text not null,
  password_hash  text not null,
  created_at     timestamptz default now()
);

create table if not exists public.progress (
  siswa_id      uuid references public.siswa(id) on delete cascade,
  modul_id      text not null,
  selesai       boolean default false,
  skor          int,
  hint_dipakai  int default 0,
  updated_at    timestamptz default now(),
  primary key (siswa_id, modul_id)
);

create table if not exists public.attempts (
  id               bigint generated always as identity primary key,
  siswa_id         uuid references public.siswa(id) on delete cascade,
  modul_id         text not null,
  soal_id          text not null,
  jawaban          text,
  benar            boolean not null,
  jenis_kesalahan  text,
  hint_level       int default 0,
  durasi_detik     int,
  created_at       timestamptz default now()
);

create table if not exists public.kuis_hasil (
  id           bigint generated always as identity primary key,
  siswa_id     uuid references public.siswa(id) on delete cascade,
  skor         int not null,
  skor_per_tp  jsonb,
  created_at   timestamptz default now()
);

create index if not exists attempts_siswa_idx on public.attempts (siswa_id, created_at);
create index if not exists kuis_hasil_siswa_idx on public.kuis_hasil (siswa_id, created_at);

-- RLS aktif TANPA policy: hanya server (service_role key) yang bisa membaca/menulis.
alter table public.siswa      enable row level security;
alter table public.progress   enable row level security;
alter table public.attempts   enable row level security;
alter table public.kuis_hasil enable row level security;
