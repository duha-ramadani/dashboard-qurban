"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Distribusi, Hewan, JenisPenerima } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { PackageOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm = {
  nama_penerima: "",
  alamat: "",
  no_hp: "",
  jenis_penerima: "shohibul_qurban" as JenisPenerima,
  jumlah_paket: 1,
  berat_kg: "",
  hewan_id: "",
  tanggal_distribusi: new Date().toISOString().split("T")[0],
  catatan: "",
};

const jenisPenerimaMap: Record<JenisPenerima, { label: string; variant: "green" | "blue" | "yellow" | "orange" | "gray" }> = {
  shohibul_qurban: { label: "Shohibul Qurban", variant: "green" },
  warga:           { label: "Warga",           variant: "blue" },
  orang_luar:      { label: "Orang Luar",       variant: "yellow" },
  panitia:         { label: "Panitia",          variant: "orange" },
  lainnya:         { label: "Lainnya",          variant: "gray" },
};

export default function DistribusiPage() {
  const supabase = createClient();
  const [distribusi, setDistribusi] = useState<Distribusi[]>([]);
  const [hewan, setHewan] = useState<Hewan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const [d, h] = await Promise.all([
      supabase.from("distribusi").select("*, hewan(*)").order("tanggal_distribusi", { ascending: false }),
      supabase.from("hewan").select("*").order("jenis"),
    ]);
    setDistribusi(d.data ?? []);
    setHewan(h.data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function openAdd() { setEditId(null); setForm(emptyForm); setModalOpen(true); }

  function openEdit(d: Distribusi) {
    setEditId(d.id);
    setForm({
      nama_penerima: d.nama_penerima,
      alamat: d.alamat ?? "",
      no_hp: d.no_hp ?? "",
      jenis_penerima: d.jenis_penerima,
      jumlah_paket: d.jumlah_paket,
      berat_kg: d.berat_kg?.toString() ?? "",
      hewan_id: d.hewan_id ?? "",
      tanggal_distribusi: d.tanggal_distribusi,
      catatan: d.catatan ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nama_penerima.trim()) return;
    setSaving(true);
    const payload = {
      nama_penerima: form.nama_penerima,
      alamat: form.alamat || null,
      no_hp: form.no_hp || null,
      jenis_penerima: form.jenis_penerima,
      jumlah_paket: Number(form.jumlah_paket),
      berat_kg: form.berat_kg ? Number(form.berat_kg) : null,
      hewan_id: form.hewan_id || null,
      tanggal_distribusi: form.tanggal_distribusi,
      catatan: form.catatan || null,
    };
    if (editId) { await supabase.from("distribusi").update(payload).eq("id", editId); }
    else { await supabase.from("distribusi").insert(payload); }
    setSaving(false);
    setModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from("distribusi").delete().eq("id", id);
    setDeleteId(null);
    fetchData();
  }

  const totalPaket = distribusi.reduce((s, d) => s + d.jumlah_paket, 0);
  const totalBerat = distribusi.reduce((s, d) => s + (d.berat_kg ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Distribusi Daging</h1>
          <p className="text-sm text-slate-500 mt-0.5">Pencatatan distribusi daging qurban</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} />Tambah Distribusi</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Penerima", value: distribusi.length },
          { label: "Total Paket", value: totalPaket },
          { label: "Total Berat", value: `${totalBerat.toFixed(1)} kg` },
          { label: "Shohibul Qurban", value: distribusi.filter((d) => d.jenis_penerima === "shohibul_qurban").length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Memuat data...</div>
        ) : distribusi.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Belum ada data distribusi"
            description="Tambahkan pencatatan distribusi daging qurban"
            action={<Button onClick={openAdd} size="sm"><Plus size={14} />Tambah Distribusi</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Penerima</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Jenis</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Paket</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Berat</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hewan</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Tanggal</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {distribusi.map((d) => {
                  const jp = jenisPenerimaMap[d.jenis_penerima];
                  return (
                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {d.nama_penerima}
                        {d.alamat && <p className="text-xs text-slate-400 font-normal">{d.alamat}</p>}
                      </td>
                      <td className="px-4 py-3"><Badge variant={jp.variant}>{jp.label}</Badge></td>
                      <td className="px-4 py-3 text-center text-slate-700 font-medium">{d.jumlah_paket}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{d.berat_kg ? `${d.berat_kg} kg` : "—"}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">
                        {d.hewan ? (d.hewan as Hewan).nama_hewan ?? (d.hewan as Hewan).jenis : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(d.tanggal_distribusi)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(d.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={14} /></Button>
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

      {/* Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Distribusi" : "Tambah Distribusi"}>
        <div className="space-y-4">
          <Input label="Nama Penerima *" value={form.nama_penerima} onChange={(e) => setForm({ ...form, nama_penerima: e.target.value })} placeholder="Nama penerima daging" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="No. HP" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} placeholder="08xxxxxxxxxx" />
            <Select
              label="Jenis Penerima"
              value={form.jenis_penerima}
              onChange={(e) => setForm({ ...form, jenis_penerima: e.target.value as JenisPenerima })}
              options={[
                { value: "shohibul_qurban", label: "Shohibul Qurban" },
                { value: "warga",          label: "Warga" },
                { value: "orang_luar",     label: "Orang Luar" },
                { value: "panitia",        label: "Panitia" },
                { value: "lainnya",        label: "Lainnya" },
              ]}
            />
          </div>
          <Textarea label="Alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat penerima" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Jumlah Paket" type="number" min={1} value={form.jumlah_paket} onChange={(e) => setForm({ ...form, jumlah_paket: Number(e.target.value) })} />
            <Input label="Berat Total (kg)" type="number" step="0.1" min="0" value={form.berat_kg} onChange={(e) => setForm({ ...form, berat_kg: e.target.value })} placeholder="2.5" />
          </div>
          <Select
            label="Dari Hewan"
            value={form.hewan_id}
            onChange={(e) => setForm({ ...form, hewan_id: e.target.value })}
            options={[
              { value: "", label: "— Pilih hewan (opsional) —" },
              ...hewan.map((h) => ({ value: h.id, label: `${h.nama_hewan ?? (h.jenis === "sapi" ? "Sapi" : "Kambing/Domba")} (${h.jenis})` })),
            ]}
          />
          <Input label="Tanggal Distribusi" type="date" value={form.tanggal_distribusi} onChange={(e) => setForm({ ...form, tanggal_distribusi: e.target.value })} />
          <Textarea label="Catatan" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder="Catatan distribusi..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.nama_penerima.trim()}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Data Distribusi">
        <p className="text-sm text-slate-600 mb-4">Yakin ingin menghapus data distribusi ini?</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
