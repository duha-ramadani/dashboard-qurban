-- ============================================================
-- SCHEMA: Dashboard Qurban Idul Adha
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS hewan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('sapi', 'kambing', 'domba')),
  nama_hewan VARCHAR(100),
  berat_kg DECIMAL(5,2),
  harga BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'tersedia' CHECK (status IN ('tersedia', 'terjual', 'disembelih')),
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peserta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama VARCHAR(200) NOT NULL,
  no_hp VARCHAR(20),
  alamat TEXT,
  jenis_qurban VARCHAR(20) NOT NULL CHECK (jenis_qurban IN ('qurban', 'aqiqah')),
  jenis_hewan VARCHAR(20) NOT NULL CHECK (jenis_hewan IN ('sapi', 'kambing', 'domba')),
  jumlah_bagian INTEGER NOT NULL DEFAULT 1,
  nominal_bayar BIGINT NOT NULL DEFAULT 0,
  status_bayar VARCHAR(20) NOT NULL DEFAULT 'belum_lunas' CHECK (status_bayar IN ('lunas', 'belum_lunas', 'dp')),
  hewan_id UUID REFERENCES hewan(id) ON DELETE SET NULL,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS distribusi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_penerima VARCHAR(200) NOT NULL,
  alamat TEXT,
  no_hp VARCHAR(20),
  jenis_penerima VARCHAR(20) NOT NULL DEFAULT 'fakir_miskin' CHECK (jenis_penerima IN ('fakir_miskin', 'panitia', 'shohibul_qurban', 'lainnya')),
  jumlah_paket INTEGER NOT NULL DEFAULT 1,
  berat_kg DECIMAL(5,2),
  hewan_id UUID REFERENCES hewan(id) ON DELETE SET NULL,
  tanggal_distribusi DATE DEFAULT CURRENT_DATE,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_event VARCHAR(200) NOT NULL DEFAULT 'Qurban Idul Adha 1446H',
  nama_panitia VARCHAR(200),
  alamat_lokasi TEXT,
  tanggal_pelaksanaan DATE,
  target_sapi INTEGER DEFAULT 0,
  target_kambing INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (nama_event, nama_panitia, tanggal_pelaksanaan)
VALUES ('Qurban Idul Adha 1446H', 'Panitia Qurban', '2025-06-06')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hewan_updated_at BEFORE UPDATE ON hewan FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER peserta_updated_at BEFORE UPDATE ON peserta FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER distribusi_updated_at BEFORE UPDATE ON distribusi FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE hewan ENABLE ROW LEVEL SECURITY;
ALTER TABLE peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribusi ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON hewan FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON peserta FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON distribusi FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_read" ON hewan FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON peserta FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON distribusi FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON settings FOR SELECT TO anon USING (true);
