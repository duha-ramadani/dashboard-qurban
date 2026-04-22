"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Distribusi, Hewan, Peserta } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";

async function exportToExcel(
  sheetName: string,
  data: Record<string, unknown>[],
  filename: string
) {
  if (data.length === 0) return;
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const keys = Object.keys(data[0]);
  ws["!cols"] = keys.map((key) => ({
    wch: Math.max(key.length, ...data.map((row) => String(row[key] ?? "").length)) + 2,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export default function LaporanPage() {
  const supabase = createClient();
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [hewan, setHewan] = useState<Hewan[]>([]);
  const [distribusi, setDistribusi] = useState<Distribusi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [p, h, d] = await Promise.all([
        supabase.from("peserta").select("*").order("nama"),
        supabase.from("hewan").select("*").order("jenis"),
        supabase.from("distribusi").select("*, hewan(*)").order("tanggal_distribusi", { ascending: false }),
      ]);
      setPeserta(p.data ?? []);
      setHewan(h.data ?? []);
      setDistribusi(d.data ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalPemasukan = peserta.reduce((s, p) => s + p.nominal_bayar, 0);
  const pesertaLunas = peserta.filter((p) => p.status_bayar === "lunas").length;
  const hewanDisembelih = hewan.filter((h) => h.status === "sudah_disembelih").length;
  const totalPaket = distribusi.reduce((s, d) => s + d.jumlah_paket, 0);

  function downloadPeserta() {
    exportToExcel(
      "Shohibul Qurban",
      peserta.map((p) => ({
        Nama: p.nama,
        "No HP": p.no_hp ?? "",
        Alamat: p.alamat ?? "",
        "Jenis Hewan": p.jenis_hewan === "sapi" ? "Sapi" : "Kambing/Domba",
        "Jumlah Bagian": p.jumlah_bagian,
        "Nominal Bayar (Rp)": p.nominal_bayar,
        "Status Bayar": p.status_bayar === "lunas" ? "Lunas" : "Belum Bayar",
        Catatan: p.catatan ?? "",
      })),
      "laporan_shohibul_qurban"
    );
  }

  function downloadHewan() {
    exportToExcel(
      "Data Hewan",
      hewan.map((h) => ({
        Jenis: h.jenis === "sapi" ? "Sapi" : "Kambing/Domba",
        "Nama / Label": h.nama_hewan ?? "",
        "Berat (kg)": h.berat_kg ?? "",
        "Harga (Rp)": h.harga,
        Status: h.status === "sudah_disembelih" ? "Sudah Disembelih" : "Belum Disembelih",
        Keterangan: h.keterangan ?? "",
      })),
      "laporan_hewan"
    );
  }

  function downloadDistribusi() {
    exportToExcel(
      "Distribusi",
      distribusi.map((d) => ({
        "Nama Penerima": d.nama_penerima,
        Alamat: d.alamat ?? "",
        "No HP": d.no_hp ?? "",
        "Jenis Penerima": d.jenis_penerima,
        "Jumlah Paket": d.jumlah_paket,
        "Berat (kg)": d.berat_kg ?? "",
        "Hewan Asal": (d.hewan as Hewan)?.nama_hewan ?? (d.hewan as Hewan)?.jenis ?? "",
        "Tanggal Distribusi": d.tanggal_distribusi,
        Catatan: d.catatan ?? "",
      })),
      "laporan_distribusi"
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Laporan</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ringkasan dan export data qurban</p>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle>Ringkasan Kegiatan Qurban</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-400">Memuat data...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Shohibul Qurban", value: peserta.length,          sub: `${pesertaLunas} lunas` },
                { label: "Total Hewan",     value: hewan.length,            sub: `${hewanDisembelih} disembelih` },
                { label: "Total Pemasukan", value: formatCurrency(totalPemasukan), sub: "dari semua shohibul" },
                { label: "Paket Distribusi",value: totalPaket,              sub: `${distribusi.length} penerima` },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className="text-lg font-bold text-slate-800">{value}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {
          [
            {
              title: "Laporan Shohibul Qurban",
              desc: `${peserta.length} data shohibul`,
              badge: `${pesertaLunas} lunas · ${peserta.length - pesertaLunas} belum`,
              onClick: downloadPeserta,
            },
            {
              title: "Laporan Hewan",
              desc: `${hewan.length} ekor hewan`,
              badge: `${hewanDisembelih} disembelih`,
              onClick: downloadHewan,
            },
            {
              title: "Laporan Distribusi",
              desc: `${distribusi.length} data distribusi`,
              badge: `${totalPaket} paket total`,
              onClick: downloadDistribusi,
            },
          ].map(({ title, desc, badge, onClick }) => (
            <div key={title} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="bg-green-50 p-2.5 rounded-lg">
                  <FileText size={20} className="text-green-600" />
                </div>
                <Badge variant="gray">{badge}</Badge>
              </div>
              <div>
                <p className="font-semibold text-slate-800">{title}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onClick} className="w-full">
                <Download size={14} />Download Excel
              </Button>
            </div>
          ))
        }
      </div>

      {/* Rekap per jenis */}
      <Card>
        <CardHeader><CardTitle>Rekap Hewan per Jenis</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Jenis</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Belum Disembelih</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Sudah Disembelih</th>
              </tr>
            </thead>
            <tbody>
              {(["sapi", "kambing_domba"] as const).map((jenis) => {
                const list = hewan.filter((h) => h.jenis === jenis);
                return (
                  <tr key={jenis} className="border-b border-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-700">
                      {jenis === "sapi" ? "🐄 Sapi" : "🐐 Kambing/Domba"}
                    </td>
                    <td className="px-6 py-3 text-center font-medium">{list.length}</td>
                    <td className="px-6 py-3 text-center text-slate-500">
                      {list.filter((h) => h.status === "belum_disembelih").length}
                    </td>
                    <td className="px-6 py-3 text-center text-green-600">
                      {list.filter((h) => h.status === "sudah_disembelih").length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
