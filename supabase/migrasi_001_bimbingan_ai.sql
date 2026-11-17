-- Migrasi untuk database yang SUDAH berjalan: menambah tabel Pembimbing AI.
-- Jalankan sekali di Supabase: SQL Editor -> New query -> tempel -> Run.

create table if not exists public.bimbingan_ai (
  id           bigint generated always as identity primary key,
  siswa_id     uuid references public.siswa(id) on delete cascade,
  sumber       text not null,
  ref_id       text not null,
  fase         text,
  mode         text not null,
  pesan_siswa  text not null,
  balasan      text not null,
  tersaring    boolean default false,
  cadangan     boolean default false,
  created_at   timestamptz default now()
);

create index if not exists bimbingan_ai_siswa_idx on public.bimbingan_ai (siswa_id, created_at);

-- RLS aktif TANPA policy: hanya server (service_role key) yang bisa membaca/menulis.
alter table public.bimbingan_ai enable row level security;
