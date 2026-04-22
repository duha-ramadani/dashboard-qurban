-- =============================================================
-- Migration: Perubahan enum untuk Dashboard Qurban
-- Urutan yang benar: DROP CONSTRAINT → UPDATE data → ADD CONSTRAINT
-- =============================================================

-- ─── HEWAN: status (tersedia/terjual → belum_disembelih, disembelih → sudah_disembelih) ───
ALTER TABLE hewan DROP CONSTRAINT IF EXISTS hewan_status_check;
UPDATE hewan SET status = 'belum_disembelih' WHERE status IN ('tersedia', 'terjual');
UPDATE hewan SET status = 'sudah_disembelih' WHERE status = 'disembelih';
ALTER TABLE hewan ADD CONSTRAINT hewan_status_check
  CHECK (status IN ('belum_disembelih', 'sudah_disembelih'));

-- ─── HEWAN: jenis (kambing/domba → kambing_domba) ───
ALTER TABLE hewan DROP CONSTRAINT IF EXISTS hewan_jenis_check;
UPDATE hewan SET jenis = 'kambing_domba' WHERE jenis IN ('kambing', 'domba');
ALTER TABLE hewan ADD CONSTRAINT hewan_jenis_check
  CHECK (jenis IN ('sapi', 'kambing_domba'));

-- ─── PESERTA: status_bayar (dp → belum_lunas) ───
ALTER TABLE peserta DROP CONSTRAINT IF EXISTS peserta_status_bayar_check;
UPDATE peserta SET status_bayar = 'belum_lunas' WHERE status_bayar = 'dp';
ALTER TABLE peserta ADD CONSTRAINT peserta_status_bayar_check
  CHECK (status_bayar IN ('lunas', 'belum_lunas'));

-- ─── PESERTA: jenis_hewan (kambing/domba → kambing_domba) ───
ALTER TABLE peserta DROP CONSTRAINT IF EXISTS peserta_jenis_hewan_check;
UPDATE peserta SET jenis_hewan = 'kambing_domba' WHERE jenis_hewan IN ('kambing', 'domba');
ALTER TABLE peserta ADD CONSTRAINT peserta_jenis_hewan_check
  CHECK (jenis_hewan IN ('sapi', 'kambing_domba'));

-- ─── PESERTA: hapus kolom jenis_qurban ───
ALTER TABLE peserta DROP COLUMN IF EXISTS jenis_qurban;

-- ─── DISTRIBUSI: jenis_penerima (fakir_miskin → lainnya, tambah warga/orang_luar) ───
ALTER TABLE distribusi DROP CONSTRAINT IF EXISTS distribusi_jenis_penerima_check;
UPDATE distribusi SET jenis_penerima = 'lainnya' WHERE jenis_penerima = 'fakir_miskin';
ALTER TABLE distribusi ADD CONSTRAINT distribusi_jenis_penerima_check
  CHECK (jenis_penerima IN ('shohibul_qurban', 'warga', 'orang_luar', 'panitia', 'lainnya'));
