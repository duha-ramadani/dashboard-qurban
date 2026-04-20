"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Hewan, JenisHewan, StatusHewan } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Beef, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm = { jenis: "kambing" as JenisHewan, nama_hewan: "", berat_kg: "", harga: "", status: "tersedia" as StatusHewan, keterangan: "" };

const statusMap: Record<StatusHewan, { label: string; variant: "green" | "yellow" | "gray" }> = {
  tersedia: { label: "Tersedia", variant: "green" },
  terjual: { label: "Terjual", variant: "yellow" },
  disembelih: { label: "Disembelih", variant: "gray" },
};

export default function HewanPage() {
  const supabase = createClient();
  const [hewan, setHewan] = useState<Hewan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState("semua");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const { data } = await supabase.from("hewan").select("*").order("created_at", { ascending: false });
    setHewan(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function openAdd() { setEditId(null); setForm(emptyForm); setModalOpen(true); }

  function openEdit(h: Hewan) {
    setEditId(h.id);
    setForm({ jenis: h.jenis, nama_hewan: h.nama_hewan ?? "", berat_kg: h.berat_kg?.toString() ?? "", harga: h.harga.toString(), status: h.status, keterangan: h.keterangan ?? "" });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.harga) return;
    setSaving(true);
    const payload = { jenis: form.jenis, nama_hewan: form.nama_hewan || null, berat_kg: form.berat_kg ? Number(form.berat_kg) : null, harga: Number(form.harga), status: form.status, keterangan: form.keterangan || null };
    if (editId) { await supabase.from("hewan").update(payload).eq("id", editId); }
    else { await supabase.from("hewan").insert(payload); }
    setSaving(false); setModalOpen(false); fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from("hewan").delete().eq("id", id);
    setDeleteId(null); fetchData();
  }

  const filtered = hewan.filter((h) => filterJenis === "semua" || h.jenis === filterJenis);
  const counts = { sapi: hewan.filter((h) => h.jenis === "sapi").length, kambing: hewan.filter((h) => h.jenis === "kambing").length, domba: hewan.filter((h) => h.jenis === "domba").length };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Data Hewan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manajemen stok hewan qurban</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} />Tambah Hewan</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["semua", "sapi", "kambing", "domba"] as const).map((j) => (
          <button key={j} onClick={() => setFilterJenis(j)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterJenis === j ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {j === "semua" ? `Semua (${hewan.length})` : `${j.charAt(0).toUpperCase() + j.slice(1)} (${counts[j]})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Beef} title="Belum ada data hewan" description="Tambahkan hewan qurban ke dalam daftar" action={<Button onClick={openAdd} size="sm"><Plus size={14} />Tambah Hewan</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Jenis</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Nama / ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Berat</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Harga</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => {
                  const s = statusMap[h.status];
                  return (
                    <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 capitalize"><span className="inline-flex items-center gap-1.5"><span className="text-lg">{h.jenis === "sapi" ? "🐄" : h.jenis === "kambing" ? "🐐" : "🐑"}</span><span className="text-slate-700 font-medium">{h.jenis}</span></span></td>
                      <td className="px-4 py-3 text-slate-600">{h.nama_hewan ?? <span className="text-slate-400 italic">—</span>}{h.keterangan && <p className="text-xs text-slate-400">{h.keterangan}</p>}</td>
                      <td className="px-4 py-3 text-slate-600">{h.berat_kg ? `${h.berat_kg} kg` : "—"}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(h.harga)}</td>
                      <td className="px-4 py-3 text-center"><Badge variant={s.variant}>{s.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(h)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(h.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Hewan" : "Tambah Hewan"}>
        <div className="space-y-4">
          <Select label="Jenis Hewan" value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value as JenisHewan })} options={[{ value: "kambing", label: "Kambing" }, { value: "domba", label: "Domba" }, { value: "sapi", label: "Sapi" }]} />
          <Input label="Nama / Label Hewan" value={form.nama_hewan} onChange={(e) => setForm({ ...form, nama_hewan: e.target.value })} placeholder="Contoh: Kambing 01, Sapi Besar A" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Berat (kg)" type="number" step="0.5" min="0" value={form.berat_kg} onChange={(e) => setForm({ ...form, berat_kg: e.target.value })} placeholder="25" />
            <Input label="Harga (Rp) *" type="number" min="0" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} placeholder="2500000" />
          </div>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StatusHewan })} options={[{ value: "tersedia", label: "Tersedia" }, { value: "terjual", label: "Terjual / Dipesan" }, { value: "disembelih", label: "Sudah Disembelih" }]} />
          <Textarea label="Keterangan" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Keterangan tambahan..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.harga}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Hewan">
        <p className="text-sm text-slate-600 mb-4">Yakin ingin menghapus data hewan ini? Data peserta yang terhubung akan terputus.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
