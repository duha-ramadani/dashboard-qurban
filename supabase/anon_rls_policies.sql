-- ============================================================
-- Anon Read Policies untuk halaman Display Dashboard
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Izinkan akses baca publik (tanpa login) untuk halaman display
CREATE POLICY "public_read_hewan"
  ON public.hewan FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_peserta"
  ON public.peserta FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_distribusi"
  ON public.distribusi FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_settings"
  ON public.settings FOR SELECT TO anon USING (true);

-- Aktifkan Realtime untuk semua tabel
ALTER PUBLICATION supabase_realtime ADD TABLE public.hewan;
ALTER PUBLICATION supabase_realtime ADD TABLE public.peserta;
ALTER PUBLICATION supabase_realtime ADD TABLE public.distribusi;

SELECT 'Anon policies dan Realtime berhasil diaktifkan' AS status;
