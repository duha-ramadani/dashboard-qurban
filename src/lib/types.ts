export type JenisHewan = "sapi" | "kambing_domba";
export type StatusHewan = "belum_disembelih" | "sudah_disembelih";
export type StatusBayar = "lunas" | "belum_lunas";
export type JenisPenerima = "shohibul_qurban" | "warga" | "orang_luar" | "panitia" | "lainnya";

export interface Hewan {
  id: string;
  jenis: JenisHewan;
  nama_hewan: string | null;
  berat_kg: number | null;
  harga: number;
  status: StatusHewan;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Peserta {
  id: string;
  nama: string;
  no_hp: string | null;
  alamat: string | null;
  jenis_hewan: JenisHewan;
  jumlah_bagian: number;
  nominal_bayar: number;
  status_bayar: StatusBayar;
  hewan_id: string | null;
  catatan: string | null;
  hewan?: Hewan;
  created_at: string;
  updated_at: string;
}

export interface Distribusi {
  id: string;
  nama_penerima: string;
  alamat: string | null;
  no_hp: string | null;
  jenis_penerima: JenisPenerima;
  jumlah_paket: number;
  berat_kg: number | null;
  hewan_id: string | null;
  tanggal_distribusi: string;
  catatan: string | null;
  hewan?: Hewan;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  nama_event: string;
  nama_panitia: string | null;
  alamat_lokasi: string | null;
  tanggal_pelaksanaan: string | null;
  target_sapi: number;
  target_kambing: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalPeserta: number;
  totalHewan: number;
  hewanBelumDisembelih: number;
  hewanSudahDisembelih: number;
  totalPemasukan: number;
  pesertaLunas: number;
  pesertaBelumLunas: number;
  totalDistribusi: number;
  sapiCount: number;
  kambingDombaCount: number;
}
