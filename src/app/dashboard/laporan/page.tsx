"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Distribusi, Hewan, Peserta } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";

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

  function downloadCSV(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }

  const totalPemasukan = peserta.reduce((s, p) => s + p.nominal_bayar, 0);
  const pesertaLunas = peserta.filter((p) => p.status_bayar === "lunas").length;
  const hewanDisembelih = hewan.filter((h) => h.status === "disembelih").length;
  const totalPaketDistribusi = distribusi.reduce((s, d) => s + d.jumlah_paket, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Laporan</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ringkasan dan export data qurban</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Ringkasan Kegiatan Qurban</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-400">Memuat data...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total Peserta", value: peserta.length, sub: `${pesertaLunas} lunas` },
                { label: "Total Hewan", value: hewan.length, sub: `${hewanDisembelih} disembelih` },
                { label: "Total Pemasukan", value: formatCurrency(totalPemasukan), sub: "dari semua peserta" },
                { label: "Paket Distribusi", value: totalPaketDistribusi, sub: `${distribusi.length} penerima` },
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { title: "Laporan Peserta", desc: `${peserta.length} data peserta`, badge: `${pesertaLunas} lunas · ${peserta.length - pesertaLunas} belum`, onClick: () => downloadCSV(peserta.map((p) => ({ Nama: p.nama, "No HP": p.no_hp ?? "", Alamat: p.alamat ?? "", "Jenis Qurban": p.jenis_qurban, "Jenis Hewan": p.jenis_hewan, "Jumlah Bagian": p.jumlah_bagian, "Nominal Bayar": p.nominal_bayar, "Status Bayar": p.status_bayar, Catatan: p.catatan ?? "" })), "laporan_peserta") },
          { title: "Laporan Hewan", desc: `${hewan.length} ekor hewan`, badge: `${hewan.filter((h) => h.status === "tersedia").length} tersedia`, onClick: () => downloadCSV(hewan.map((h) => ({ Jenis: h.jenis, Nama: h.nama_hewan ?? "", "Berat (kg)": h.berat_kg ?? "", "Harga (Rp)": h.harga, Status: h.status, Keterangan: h.keterangan ?? "" })), "laporan_hewan") },
          { title: "Laporan Distribusi", desc: `${distribusi.length} data distribusi`, badge: `${totalPaketDistribusi} paket total`, onClick: () => downloadCSV(distribusi.map((d) => ({ "Nama Penerima": d.nama_penerima, Alamat: d.alamat ?? "", "No HP": d.no_hp ?? "", "Jenis Penerima": d.jenis_penerima, "Jumlah Paket": d.jumlah_paket, "Berat (kg)": d.berat_kg ?? "", "Hewan Asal": (d.hewan as Hewan)?.nama_hewan ?? (d.hewan as Hewan)?.jenis ?? "", "Tanggal Distribusi": d.tanggal_distribusi, Catatan: d.catatan ?? "" })), "laporan_distribusi") },
        ].map(({ title, desc, badge, onClick }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="bg-green-50 p-2.5 rounded-lg"><FileText size={20} className="text-green-600" /></div>
              <Badge variant="gray">{badge}</Badge>
            </div>
            <div>
              <p className="font-semibold text-slate-800">{title}</p>
              <p className="text-sm text-slate-500">{desc}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onClick} className="w-full"><Download size={14} />Download CSV</Button>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Rekap Hewan per Jenis</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Jenis</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Tersedia</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Terjual</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Disembelih</th>
              </tr>
            </thead>
            <tbody>
              {(["sapi", "kambing", "domba"] as const).map((jenis) => {
                const list = hewan.filter((h) => h.jenis === jenis);
                return (
                  <tr key={jenis} className="border-b border-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-700 capitalize">{jenis === "sapi" ? "🐄" : jenis === "kambing" ? "🐐" : "🐑"} {jenis}</td>
                    <td className="px-6 py-3 text-center">{list.length}</td>
                    <td className="px-6 py-3 text-center text-green-600">{list.filter((h) => h.status === "tersedia").length}</td>
                    <td className="px-6 py-3 text-center text-yellow-600">{list.filter((h) => h.status === "terjual").length}</td>
                    <td className="px-6 py-3 text-center text-slate-500">{list.filter((h) => h.status === "disembelih").length}</td>
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
