-- Migration: tambah kolom position untuk urutan kartu kanban hewan
ALTER TABLE hewan ADD COLUMN IF NOT EXISTS position INTEGER;

-- Inisialisasi nilai position berdasarkan urutan created_at per kolom status
UPDATE hewan SET position = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at) AS row_num
  FROM hewan
) sub
WHERE hewan.id = sub.id;
