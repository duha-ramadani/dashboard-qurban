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
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Beef, GripVertical, LayoutGrid, List, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm = {
  jenis: "kambing_domba" as JenisHewan,
  nama_hewan: "",
  berat_kg: "",
  harga: "",
  status: "belum_disembelih" as StatusHewan,
  keterangan: "",
};

const JENIS_EMOJI: Record<JenisHewan, string> = {
  sapi: "🐄",
  kambing_domba: "🐐",
};

const JENIS_LABEL: Record<JenisHewan, string> = {
  sapi: "Sapi",
  kambing_domba: "Kambing/Domba",
};

function DraggableCard({
  hewan,
  onEdit,
  onDelete,
}: {
  hewan: Hewan;
  onEdit: (h: Hewan) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: hewan.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm ${
        isDragging ? "opacity-40 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 mt-0.5 flex-shrink-0 touch-none"
        >
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">{JENIS_EMOJI[hewan.jenis]}</span>
            <span className="font-medium text-slate-800 text-sm truncate">
              {hewan.nama_hewan ?? JENIS_LABEL[hewan.jenis]}
            </span>
          </div>
          <div className="text-xs text-slate-500 space-y-0.5">
            {hewan.berat_kg && <p>{hewan.berat_kg} kg</p>}
            <p className="font-medium text-slate-700">{formatCurrency(hewan.harga)}</p>
            {hewan.keterangan && <p className="text-slate-400 truncate">{hewan.keterangan}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(hewan)} className="h-6 w-6 p-0">
            <Pencil size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(hewan.id)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({
  status, label, dotColor, children, count,
}: {
  status: StatusHewan;
  label: string;
  dotColor: string;
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] rounded-xl border-2 transition-colors ${
        isOver ? "border-green-400 bg-green-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${dotColor}`} />
          <span className="font-semibold text-slate-700 text-sm">{label}</span>
        </div>
        <span className="text-xs bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-600">{count}</span>
      </div>
      <div className="p-3 space-y-2 min-h-[200px]">{children}</div>
    </div>
  );
}

export default function HewanPage() {
  const supabase = createClient();
  const [hewan, setHewan] = useState<Hewan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState("semua");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  async function fetchData() {
    const { data } = await supabase.from("hewan").select("*").order("created_at", { ascending: false });
    setHewan(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function openAdd() { setEditId(null); setForm(emptyForm); setModalOpen(true); }

  function openEdit(h: Hewan) {
    setEditId(h.id);
    setForm({
      jenis: h.jenis,
      nama_hewan: h.nama_hewan ?? "",
      berat_kg: h.berat_kg?.toString() ?? "",
      harga: h.harga.toString(),
      status: h.status,
      keterangan: h.keterangan ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.harga) return;
    setSaving(true);
    const payload = {
      jenis: form.jenis,
      nama_hewan: form.nama_hewan || null,
      berat_kg: form.berat_kg ? Number(form.berat_kg) : null,
      harga: Number(form.harga),
      status: form.status,
      keterangan: form.keterangan || null,
    };
    if (editId) {
      await supabase.from("hewan").update(payload).eq("id", editId);
    } else {
      await supabase.from("hewan").insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from("hewan").delete().eq("id", id);
    setDeleteId(null);
    fetchData();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggingId(null);
    if (!over) return;
    const hewanId = active.id as string;
    const newStatus = over.id as StatusHewan;
    const current = hewan.find((h) => h.id === hewanId);
    if (!current || current.status === newStatus) return;
    setHewan((prev) => prev.map((h) => (h.id === hewanId ? { ...h, status: newStatus } : h)));
    await supabase.from("hewan").update({ status: newStatus }).eq("id", hewanId);
  }

  const filtered = hewan.filter((h) => filterJenis === "semua" || h.jenis === filterJenis);
  const counts: Record<JenisHewan, number> = {
    sapi: hewan.filter((h) => h.jenis === "sapi").length,
    kambing_domba: hewan.filter((h) => h.jenis === "kambing_domba").length,
  };
  const belumDisembelih = filtered.filter((h) => h.status === "belum_disembelih");
  const sudahDisembelih = filtered.filter((h) => h.status === "sudah_disembelih");
  const draggingHewan = draggingId ? hewan.find((h) => h.id === draggingId) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Data Hewan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manajemen stok hewan qurban</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                view === "kanban" ? "bg-green-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                view === "list" ? "bg-green-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <List size={14} /> Daftar
            </button>
          </div>
          <Button onClick={openAdd}><Plus size={16} /> Tambah Hewan</Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["semua", "sapi", "kambing_domba"] as const).map((j) => (
          <button
            key={j}
            onClick={() => setFilterJenis(j)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterJenis === j ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {j === "semua" ? `Semua (${hewan.length})` : `${JENIS_LABEL[j as JenisHewan]} (${counts[j as JenisHewan]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Memuat data...</div>
      ) : view === "kanban" ? (
        hewan.length === 0 ? (
          <EmptyState icon={Beef} title="Belum ada data hewan" description="Tambahkan hewan qurban ke dalam daftar"
            action={<Button onClick={openAdd} size="sm"><Plus size={14} />Tambah Hewan</Button>}
          />
        ) : (
          <DndContext sensors={sensors} onDragStart={(e) => setDraggingId(e.active.id as string)} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              <DroppableColumn status="belum_disembelih" label="Belum Disembelih" dotColor="bg-amber-400" count={belumDisembelih.length}>
                {belumDisembelih.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Tarik kartu ke sini</p>
                ) : belumDisembelih.map((h) => (
                  <DraggableCard key={h.id} hewan={h} onEdit={openEdit} onDelete={(id) => setDeleteId(id)} />
                ))}
              </DroppableColumn>
              <DroppableColumn status="sudah_disembelih" label="Sudah Disembelih" dotColor="bg-green-500" count={sudahDisembelih.length}>
                {sudahDisembelih.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Tarik kartu ke sini</p>
                ) : sudahDisembelih.map((h) => (
                  <DraggableCard key={h.id} hewan={h} onEdit={openEdit} onDelete={(id) => setDeleteId(id)} />
                ))}
              </DroppableColumn>
            </div>
            <DragOverlay>
              {draggingHewan && (
                <div className="bg-white rounded-lg border-2 border-green-400 p-3 shadow-xl w-64 rotate-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{JENIS_EMOJI[draggingHewan.jenis]}</span>
                    <span className="font-medium text-slate-800 text-sm">
                      {draggingHewan.nama_hewan ?? JENIS_LABEL[draggingHewan.jenis]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{formatCurrency(draggingHewan.harga)}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Beef} title="Belum ada data hewan" description="Tambahkan hewan qurban ke dalam daftar"
              action={<Button onClick={openAdd} size="sm"><Plus size={14} />Tambah Hewan</Button>}
            />
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
                  {filtered.map((h) => (
                    <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-lg">{JENIS_EMOJI[h.jenis]}</span>
                          <span className="text-slate-700 font-medium">{JENIS_LABEL[h.jenis]}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {h.nama_hewan ?? <span className="text-slate-400 italic">—</span>}
                        {h.keterangan && <p className="text-xs text-slate-400">{h.keterangan}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{h.berat_kg ? `${h.berat_kg} kg` : "—"}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(h.harga)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={h.status === "belum_disembelih" ? "yellow" : "green"}>
                          {h.status === "belum_disembelih" ? "Belum Disembelih" : "Sudah Disembelih"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(h)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(h.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Hewan" : "Tambah Hewan"}>
        <div className="space-y-4">
          <Select label="Jenis Hewan" value={form.jenis}
            onChange={(e) => setForm({ ...form, jenis: e.target.value as JenisHewan })}
            options={[
              { value: "kambing_domba", label: "Kambing/Domba" },
              { value: "sapi", label: "Sapi" },
            ]}
          />
          <Input label="Nama / Label Hewan" value={form.nama_hewan}
            onChange={(e) => setForm({ ...form, nama_hewan: e.target.value })}
            placeholder="Contoh: Kambing 01, Sapi Besar A"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Berat (kg)" type="number" step="0.5" min="0" value={form.berat_kg}
              onChange={(e) => setForm({ ...form, berat_kg: e.target.value })} placeholder="25" />
            <Input label="Harga (Rp) *" type="number" min="0" value={form.harga}
              onChange={(e) => setForm({ ...form, harga: e.target.value })} placeholder="2500000" />
          </div>
          <Select label="Status" value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as StatusHewan })}
            options={[
              { value: "belum_disembelih", label: "Belum Disembelih" },
              { value: "sudah_disembelih", label: "Sudah Disembelih" },
            ]}
          />
          <Textarea label="Keterangan" value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            placeholder="Keterangan tambahan tentang hewan..." />
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
