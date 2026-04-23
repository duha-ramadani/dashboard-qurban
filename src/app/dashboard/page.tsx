"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { DashboardStats, Peserta, Settings } from "@/lib/types";
import {
  Beef,
  Users,
  PackageOpen,
  Wallet,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";

const defaultStats: DashboardStats = {
  totalPeserta: 0,
  totalHewan: 0,
  hewanBelumDisembelih: 0,
  hewanSudahDisembelih: 0,
  totalPemasukan: 0,
  pesertaLunas: 0,
  pesertaBelumLunas: 0,
  totalDistribusi: 0,
  sapiCount: 0,
  kambingDombaCount: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [recentPeserta, setRecentPeserta] = useState<Peserta[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const [pesertaRes, hewanRes, distribusiRes, settingsRes] = await Promise.all([
          supabase.from("peserta").select("*, hewan(*)").order("created_at", { ascending: false }),
          supabase.from("hewan").select("*"),
          supabase.from("distribusi").select("id"),
          supabase.from("settings").select("*").limit(1).single(),
        ]);

        const pesertaData = pesertaRes.data ?? [];
        const hewanData = hewanRes.data ?? [];
        const distribusiData = distribusiRes.data ?? [];

        setStats({
          totalPeserta: pesertaData.length,
          totalHewan: hewanData.length,
          hewanBelumDisembelih: hewanData.filter((h) => h.status === "belum_disembelih").length,
          hewanSudahDisembelih: hewanData.filter((h) => h.status === "sudah_disembelih").length,
          totalPemasukan: pesertaData.reduce((sum, p) => sum + (p.nominal_bayar ?? 0), 0),
          pesertaLunas: pesertaData.filter((p) => p.status_bayar === "lunas").length,
          pesertaBelumLunas: pesertaData.filter((p) => p.status_bayar === "belum_lunas").length,
          totalDistribusi: distribusiData.length,
          sapiCount: hewanData.filter((h) => h.jenis === "sapi").length,
          kambingDombaCount: hewanData.filter((h) => h.jenis === "kambing_domba").length,
        });

        setRecentPeserta(pesertaData.slice(0, 5));
        if (settingsRes.data) setSettings(settingsRes.data);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          {settings?.nama_event ?? "Dashboard Qurban"}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Selamat datang, {settings?.nama_panitia ?? "Panitia"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Shohibul Qurban"
          value={loading ? "—" : stats.totalPeserta}
          subtitle={`${stats.pesertaLunas} lunas · ${stats.pesertaBelumLunas} belum`}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Total Hewan"
          value={loading ? "—" : stats.totalHewan}
          subtitle={`${stats.sapiCount} sapi · ${stats.kambingDombaCount} kambing`}
          icon={Beef}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Total Pemasukan"
          value={loading ? "—" : formatCurrency(stats.totalPemasukan)}
          subtitle="dari semua shohibul"
          icon={Wallet}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Distribusi"
          value={loading ? "—" : stats.totalDistribusi}
          subtitle="paket telah dibagikan"
          icon={PackageOpen}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Progress cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Penyembelihan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: "Belum Disembelih",
                  value: stats.hewanBelumDisembelih,
                  total: stats.totalHewan,
                  color: "bg-slate-400",
                  badge: "gray" as const,
                },
                {
                  label: "Sudah Disembelih",
                  value: stats.hewanSudahDisembelih,
                  total: stats.totalHewan,
                  color: "bg-green-500",
                  badge: "green" as const,
                },
              ].map(({ label, value, total, color, badge }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{label}</span>
                    <Badge variant={badge}>{value} ekor</Badge>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: "Lunas",
                  value: stats.pesertaLunas,
                  total: stats.totalPeserta,
                  color: "bg-green-500",
                  badge: "green" as const,
                  icon: CheckCircle,
                },
                {
                  label: "Belum Bayar",
                  value: stats.pesertaBelumLunas,
                  total: stats.totalPeserta,
                  color: "bg-red-400",
                  badge: "red" as const,
                  icon: Clock,
                },
              ].map(({ label, value, total, color, badge }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{label}</span>
                    <Badge variant={badge}>{value} orang</Badge>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Peserta */}
      <Card>
        <CardHeader>
          <CardTitle>Shohibul Qurban Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentPeserta.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Belum ada data shohibul qurban
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Nama</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Alamat</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">No. HP</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hewan</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPeserta.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-800">{p.nama}</td>
                    <td className="px-6 py-3 text-slate-600">{p.alamat ?? "-"}</td>
                    <td className="px-6 py-3 text-slate-600">{p.no_hp ?? "-"}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {p.hewan?.nama_hewan ?? (p.jenis_hewan === "sapi" ? "🐄 Sapi" : "🐐 Kambing/Domba")}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Badge variant={p.status_bayar === "lunas" ? "green" : "red"}>
                        {p.status_bayar === "lunas" ? "Lunas" : "Belum"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
