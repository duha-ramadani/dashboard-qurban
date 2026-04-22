"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Hewan, JenisHewan, Peserta, StatusBayar } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm = {
  nama: "",
  no_hp: "",
  alamat: "",
  jenis_hewan: "kambing_domba" as JenisHewan,
  jumlah_bagian: 1,
  nominal_bayar: 0,
  status_bayar: "belum_lunas" as StatusBayar,
  hewan_id: "",
  catatan: "",
};

const statusBayarOptions = [
  { value: "lunas", label: "Lunas" },
  { value: "belum_lunas", label: "Belum Bayar" },
];

const JENIS_LABEL: Record<JenisHewan, string> = {
  sapi: "Sapi",
  kambing_domba: "Kambing/Domba",
};

export default function PesertaPage() {
  const supabase = createClient();
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [hewan, setHewan] = useState<Hewan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const [p, h] = await Promise.all([
      supabase.from("peserta").select("*, hewan(*)").order("created_at", { ascending: false }),
      supabase.from("hewan").select("*").order("jenis"),
    ]);
    setPeserta(p.data ?? []);
    setHewan(h.data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function openAdd() { setEditId(null); setForm(emptyForm); setModalOpen(true); }

  function openEdit(p: Peserta) {
    setEditId(p.id);
    setForm({
      nama: p.nama,
      no_hp: p.no_hp ?? "",
      alamat: p.alamat ?? "",
      jenis_hewan: p.jenis_hewan,
      jumlah_bagian: p.jumlah_bagian,
      nominal_bayar: p.nominal_bayar,
      status_bayar: p.status_bayar,
      hewan_id: p.hewan_id ?? "",
      catatan: p.catatan ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nama.trim()) return;
    setSaving(true);
    const payload = {
      nama: form.nama,
      no_hp: form.no_hp || null,
      alamat: form.alamat || null,
      jenis_hewan: form.jenis_hewan,
      jumlah_bagian: Number(form.jumlah_bagian),
      nominal_bayar: Number(form.nominal_bayar),
      status_bayar: form.status_bayar,
      hewan_id: form.hewan_id || null,
      catatan: form.catatan || null,
    };
    if (editId) {
      await supabase.from("peserta").update(payload).eq("id", editId);
    } else {
      await supabase.from("peserta").insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from("peserta").delete().eq("id", id);
    setDeleteId(null);
    fetchData();
  }

  const filtered = peserta.filter(
    (p) => p.nama.toLowerCase().includes(search.toLowerCase()) || (p.no_hp ?? "").includes(search)
  );

  const pesertaLunas = peserta.filter((p) => p.status_bayar === "lunas").length;
  const pesertaBelum = peserta.filter((p) => p.status_bayar !== "lunas").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Shohibul Qurban</h1>
          <p className="text-sm text-slate-500 mt-0.5">Data shohibul qurban & status pembayaran</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Tambah Shohibul Qurban</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Shohibul Qurban", value: peserta.length },
          { label: "Lunas", value: pesertaLunas },
          { label: "Belum Bayar", value: pesertaBelum },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Cari nama / no. HP..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada data" description="Tambahkan shohibul qurban pertama"
            action={<Button onClick={openAdd} size="sm"><Plus size={14} />Tambah Shohibul Qurban</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Nama</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">No. HP</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hewan</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Bagian</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Nominal</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {p.nama}
                      {p.alamat && <p className="text-xs text-slate-400 font-normal">{p.alamat}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.no_hp ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{JENIS_LABEL[p.jenis_hewan]}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{p.jumlah_bagian}</td>
                    <td className="px-4 py-3 text-right text-slate-700 font-medium">{formatCurrency(p.nominal_bayar)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={p.status_bayar === "lunas" ? "green" : "red"}>
                        {p.status_bayar === "lunas" ? "Lunas" : "Belum Bayar"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Shohibul Qurban" : "Tambah Shohibul Qurban"}>
        <div className="space-y-4">
          <Input label="Nama Lengkap *" value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama shohibul qurban" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="No. HP / WhatsApp" value={form.no_hp}
              onChange={(e) => setForm({ ...form, no_hp: e.target.value })} placeholder="08xxxxxxxxxx" />
            <Select label="Jenis Hewan" value={form.jenis_hewan}
              onChange={(e) => setForm({ ...form, jenis_hewan: e.target.value as JenisHewan })}
              options={[
                { value: "kambing_domba", label: "Kambing/Domba" },
                { value: "sapi", label: "Sapi" },
              ]}
            />
          </div>
          <Textarea label="Alamat" value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat lengkap" />
          <Select label="Pilih Hewan (opsional)" value={form.hewan_id}
            onChange={(e) => setForm({ ...form, hewan_id: e.target.value })}
            options={[
              { value: "", label: "— Belum ditentukan —" },
              ...hewan.filter((h) => h.jenis === form.jenis_hewan).map((h) => ({
                value: h.id,
                label: `${h.nama_hewan ?? JENIS_LABEL[h.jenis]} — ${formatCurrency(h.harga)}`,
              })),
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Jumlah Bagian" type="number" min={1} value={form.jumlah_bagian}
              onChange={(e) => setForm({ ...form, jumlah_bagian: Number(e.target.value) })} />
            <Input label="Nominal Bayar (Rp)" type="number" min={0} value={form.nominal_bayar}
              onChange={(e) => setForm({ ...form, nominal_bayar: Number(e.target.value) })} />
          </div>
          <Select label="Status Pembayaran" value={form.status_bayar}
            onChange={(e) => setForm({ ...form, status_bayar: e.target.value as StatusBayar })}
            options={statusBayarOptions}
          />
          <Textarea label="Catatan" value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder="Catatan tambahan..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.nama.trim()}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Shohibul Qurban">
        <p className="text-sm text-slate-600 mb-4">Yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
