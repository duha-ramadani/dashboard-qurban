-- ============================================================
-- Migration: Update status values and constraints
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================

-- 1. HEWAN: Drop constraint DULU, baru update data, lalu buat constraint baru
ALTER TABLE public.hewan DROP CONSTRAINT IF EXISTS hewan_status_check;

UPDATE public.hewan
  SET status = 'belum_disembelih'
  WHERE status IN ('tersedia', 'terjual');

UPDATE public.hewan
  SET status = 'sudah_disembelih'
  WHERE status = 'disembelih';

ALTER TABLE public.hewan
  ADD CONSTRAINT hewan_status_check
  CHECK (status IN ('belum_disembelih', 'sudah_disembelih'));

-- 2. HEWAN: Gabungkan kambing dan domba menjadi kambing_domba
ALTER TABLE public.hewan DROP CONSTRAINT IF EXISTS hewan_jenis_check;

UPDATE public.hewan
  SET jenis = 'kambing_domba'
  WHERE jenis IN ('kambing', 'domba');

ALTER TABLE public.hewan
  ADD CONSTRAINT hewan_jenis_check
  CHECK (jenis IN ('sapi', 'kambing_domba'));

-- 3. PESERTA: Drop constraint DULU, baru update data, lalu buat constraint baru
ALTER TABLE public.peserta DROP CONSTRAINT IF EXISTS peserta_status_bayar_check;

UPDATE public.peserta
  SET status_bayar = 'belum_lunas'
  WHERE status_bayar = 'dp';

ALTER TABLE public.peserta
  ADD CONSTRAINT peserta_status_bayar_check
  CHECK (status_bayar IN ('lunas', 'belum_lunas'));

-- 4. PESERTA: Gabungkan kambing dan domba menjadi kambing_domba
ALTER TABLE public.peserta DROP CONSTRAINT IF EXISTS peserta_jenis_hewan_check;

UPDATE public.peserta
  SET jenis_hewan = 'kambing_domba'
  WHERE jenis_hewan IN ('kambing', 'domba');

ALTER TABLE public.peserta
  ADD CONSTRAINT peserta_jenis_hewan_check
  CHECK (jenis_hewan IN ('sapi', 'kambing_domba'));

-- Tambahkan default pada kolom jenis_qurban agar tidak wajib diisi dari UI
ALTER TABLE public.peserta
  ALTER COLUMN jenis_qurban SET DEFAULT 'qurban';

-- 5. DISTRIBUSI: Drop constraint DULU, baru update data, lalu buat constraint baru
ALTER TABLE public.distribusi DROP CONSTRAINT IF EXISTS distribusi_jenis_penerima_check;

UPDATE public.distribusi
  SET jenis_penerima = 'lainnya'
  WHERE jenis_penerima = 'fakir_miskin';

ALTER TABLE public.distribusi
  ADD CONSTRAINT distribusi_jenis_penerima_check
  CHECK (jenis_penerima IN ('shohibul_qurban', 'warga', 'orang_luar', 'panitia', 'lainnya'));

-- Selesai!
SELECT 'Migration berhasil dijalankan' AS status;
