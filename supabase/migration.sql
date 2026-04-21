-- ============================================================
-- Migration: Update status values and constraints
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================

-- 1. HEWAN: Migrasi nilai status lama ke status baru
UPDATE public.hewan
  SET status = 'belum_disembelih'
  WHERE status IN ('tersedia', 'terjual');

UPDATE public.hewan
  SET status = 'sudah_disembelih'
  WHERE status = 'disembelih';

-- Hapus constraint lama, tambah yang baru
ALTER TABLE public.hewan DROP CONSTRAINT IF EXISTS hewan_status_check;
ALTER TABLE public.hewan
  ADD CONSTRAINT hewan_status_check
  CHECK (status IN ('belum_disembelih', 'sudah_disembelih'));

-- 2. PESERTA: Hapus opsi DP dari status_bayar
UPDATE public.peserta
  SET status_bayar = 'belum_lunas'
  WHERE status_bayar = 'dp';

ALTER TABLE public.peserta DROP CONSTRAINT IF EXISTS peserta_status_bayar_check;
ALTER TABLE public.peserta
  ADD CONSTRAINT peserta_status_bayar_check
  CHECK (status_bayar IN ('lunas', 'belum_lunas'));

-- Tambahkan default pada kolom jenis_qurban agar tidak wajib diisi dari UI
ALTER TABLE public.peserta
  ALTER COLUMN jenis_qurban SET DEFAULT 'qurban';

-- 3. DISTRIBUSI: Migrasi fakir_miskin ke lainnya, tambah jenis baru
UPDATE public.distribusi
  SET jenis_penerima = 'lainnya'
  WHERE jenis_penerima = 'fakir_miskin';

ALTER TABLE public.distribusi DROP CONSTRAINT IF EXISTS distribusi_jenis_penerima_check;
ALTER TABLE public.distribusi
  ADD CONSTRAINT distribusi_jenis_penerima_check
  CHECK (jenis_penerima IN ('shohibul_qurban', 'warga', 'orang_luar', 'panitia', 'lainnya'));

-- Selesai!
SELECT 'Migration berhasil dijalankan' AS status;
