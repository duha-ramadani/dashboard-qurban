"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { Hewan, JenisHewan, StatusHewan } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Beef, GripVertical, LayoutGrid, List, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const emptyForm = {
  jenis: "kambing_domba" as JenisHewan,
  nama_hewan: "",
  berat_kg: "",
  harga: "",
  status: "belum_disembelih" as StatusHewan,
  keterangan: "",
};

const JENIS_EMOJI: Record<JenisHewan, string> = { sapi: "🐄", kambing_domba: "🐐" };
const JENIS_LABEL: Record<JenisHewan, string> = { sapi: "Sapi", kambing_domba: "Kambing/Domba" };

const STATUS_COLS: { id: StatusHewan; label: string; variant: "gray" | "green" }[] = [
  { id: "belum_disembelih", label: "Belum Disembelih", variant: "gray" },
  { id: "sudah_disembelih", label: "Sudah Disembelih", variant: "green" },
];

function SortableCard({
  h,
  onEdit,
  onDelete,
}: {
  h: Hewan;
  onEdit: (h: Hewan) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: h.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">{JENIS_EMOJI[h.jenis]}</span>
            <span className="text-sm font-semibold text-slate-700 truncate">
              {h.nama_hewan ?? JENIS_LABEL[h.jenis]}
            </span>
          </div>
          {h.berat_kg && <p className="text-xs text-slate-400">{h.berat_kg} kg</p>}
          {h.keterangan && (
            <p className="text-xs text-slate-400 mt-1 truncate">{h.keterangan}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(h)}>
            <Pencil size={13} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(h.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Proper droppable column registered with DnD Kit
function DroppableColumn({
  status,
  label,
  variant,
  items,
  children,
}: {
  status: StatusHewan;
  label: string;
  variant: "gray" | "green";
  items: string[];
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `col:${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 rounded-xl border-2 transition-colors ${
        isOver ? "border-green-400 bg-green-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
        <Badge variant={variant}>{label}</Badge>
        <span className="text-xs text-slate-400 ml-auto">{items.length}</span>
      </div>
      <div className="p-3 space-y-2 min-h-[200px]">
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        {items.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8">Tidak ada hewan</p>
        )}
      </div>
    </div>
  );
}

export default function HewanPage() {
  const supabase = createClient();

  // Use a ref alongside state so drag handlers always read the latest value
  // without depending on React's async re-render cycle.
  const [hewan, setHewanState] = useState<Hewan[]>([]);
  const hewanRef = useRef<Hewan[]>([]);
  function setHewan(updater: Hewan[] | ((prev: Hewan[]) => Hewan[])) {
    setHewanState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      hewanRef.current = next;
      return next;
    });
  }

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filterJenis, setFilterJenis] = useState<"semua" | JenisHewan>("semua");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeHewan, setActiveHewan] = useState<Hewan | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  async function fetchData() {
    const { data } = await supabase
      .from("hewan")
      .select("*")
      .order("position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    setHewan(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (editId) { await supabase.from("hewan").update(payload).eq("id", editId); }
    else { await supabase.from("hewan").insert(payload); }
    setSaving(false);
    setModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from("hewan").delete().eq("id", id);
    setDeleteId(null);
    fetchData();
  }

  function handleDragStart(event: DragStartEvent) {
    const card = hewanRef.current.find((h) => h.id === event.active.id);
    setActiveHewan(card ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const current = hewanRef.current;
    const activeCard = current.find((h) => h.id === active.id);
    if (!activeCard) return;

    const overId = String(over.id);
    const targetStatus: StatusHewan | undefined = overId.startsWith("col:")
      ? (overId.slice(4) as StatusHewan)
      : current.find((h) => h.id === over.id)?.status;

    // Only act on cross-column moves
    if (!targetStatus || targetStatus === activeCard.status) return;

    setHewan((prev) => {
      const targetCards = prev.filter((h) => h.status === targetStatus && h.id !== activeCard.id);
      const maxPos = targetCards.reduce((m, h) => Math.max(m, h.position ?? 0), 0);
      return prev.map((h) =>
        h.id === activeCard.id ? { ...h, status: targetStatus, position: maxPos + 1 } : h
      );
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveHewan(null);

    // Dropped outside all droppables — revert
    if (!over) { fetchData(); return; }

    // Always read from ref to get state updated by handleDragOver
    const current = hewanRef.current;
    const activeCard = current.find((h) => h.id === active.id);
    if (!activeCard) return;

    const overId = String(over.id);
    const isOverCol = overId.startsWith("col:");
    const targetStatus: StatusHewan = isOverCol
      ? (overId.slice(4) as StatusHewan)
      : (current.find((h) => h.id === over.id)?.status ?? activeCard.status);

    const colCards = current.filter((h) => h.status === targetStatus);

    let reordered: Hewan[];
    if (isOverCol || activeCard.status !== targetStatus) {
      // Cross-column or dropped on column header: handleDragOver already moved the card
      reordered = colCards;
    } else {
      // Same-column reorder
      const oldIdx = colCards.findIndex((h) => h.id === active.id);
      const newIdx = colCards.findIndex((h) => h.id === over.id);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
      reordered = arrayMove(colCards, oldIdx, newIdx);
    }

    const updates = reordered.map((h, i) => ({ id: h.id, position: i + 1, status: targetStatus }));

    setHewan((prev) => {
      const map = new Map(updates.map((u) => [u.id, u]));
      return prev
        .map((h) => (map.has(h.id) ? { ...h, ...map.get(h.id) } : h))
        .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    });

    await Promise.all(
      updates.map(({ id, position, status }) =>
        supabase.from("hewan").update({ position, status }).eq("id", id)
      )
    );
  }

  const filtered = filterJenis === "semua" ? hewan : hewan.filter((h) => h.jenis === filterJenis);
  const counts = {
    sapi: hewan.filter((h) => h.jenis === "sapi").length,
    kambing_domba: hewan.filter((h) => h.jenis === "kambing_domba").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Data Hewan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manajemen stok hewan qurban</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-2 ${
                viewMode === "kanban" ? "bg-green-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
              title="Kanban"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 border-l border-slate-200 ${
                viewMode === "list" ? "bg-green-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
              title="List"
            >
              <List size={16} />
            </button>
          </div>
          <Button onClick={openAdd}><Plus size={16} />Tambah Hewan</Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "semua", label: `Semua (${hewan.length})` },
          { key: "sapi", label: `🐄 Sapi (${counts.sapi})` },
          { key: "kambing_domba", label: `🐐 Kambing/Domba (${counts.kambing_domba})` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterJenis(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterJenis === key
                ? "bg-green-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Beef}
          title="Belum ada data hewan"
          description="Tambahkan hewan qurban ke dalam daftar"
          action={<Button onClick={openAdd} size="sm"><Plus size={14} />Tambah Hewan</Button>}
        />
      ) : viewMode === "kanban" ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            {STATUS_COLS.map(({ id, label, variant }) => {
              const colCards = filtered.filter((h) => h.status === id);
              return (
                <DroppableColumn key={id} status={id} label={label} variant={variant} items={colCards.map((h) => h.id)}>
                  {colCards.map((h) => (
                    <SortableCard key={h.id} h={h} onEdit={openEdit} onDelete={(id) => setDeleteId(id)} />
                  ))}
                </DroppableColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeHewan && (
              <div className="bg-white border-2 border-green-400 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <span>{JENIS_EMOJI[activeHewan.jenis]}</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {activeHewan.nama_hewan ?? JENIS_LABEL[activeHewan.jenis]}
                  </span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                      <Badge variant={h.status === "sudah_disembelih" ? "green" : "gray"}>
                        {h.status === "sudah_disembelih" ? "Sudah Disembelih" : "Belum Disembelih"}
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
        </div>
      )}

      {/* Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Hewan" : "Tambah Hewan"}>
        <div className="space-y-4">
          <Select
            label="Jenis Hewan"
            value={form.jenis}
            onChange={(e) => setForm({ ...form, jenis: e.target.value as JenisHewan })}
            options={[
              { value: "kambing_domba", label: "Kambing/Domba" },
              { value: "sapi", label: "Sapi" },
            ]}
          />
          <Input label="Nama / Label Hewan" value={form.nama_hewan} onChange={(e) => setForm({ ...form, nama_hewan: e.target.value })} placeholder="Contoh: Sapi 01" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Berat (kg)" type="number" step="0.5" min="0" value={form.berat_kg}
              onChange={(e) => setForm({ ...form, berat_kg: e.target.value })} placeholder="25" />
            <Input label="Harga (Rp) *" type="number" min="0" value={form.harga}
              onChange={(e) => setForm({ ...form, harga: e.target.value })} placeholder="2500000" />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as StatusHewan })}
            options={[
              { value: "belum_disembelih", label: "Belum Disembelih" },
              { value: "sudah_disembelih", label: "Sudah Disembelih" },
            ]}
          />
          <Textarea label="Keterangan" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Keterangan tambahan..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.harga}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Hewan">
        <p className="text-sm text-slate-600 mb-4">Yakin ingin menghapus data hewan ini? Data shohibul qurban yang terhubung akan terputus.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
