"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Settings } from "@/lib/types";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from("settings").select("*").limit(1).single();
      if (data) setSettings(data);
      setLoading(false);
    }
    fetch();
  }, []);

  async function handleSave() {
    setSaving(true); setSaved(false);
    if (settings.id) { await supabase.from("settings").update(settings).eq("id", settings.id); }
    else { await supabase.from("settings").insert(settings); }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="py-20 text-center text-sm text-slate-400">Memuat pengaturan...</div>;

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Pengaturan</h1>
        <p className="text-sm text-slate-500 mt-0.5">Konfigurasi informasi kegiatan qurban</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Informasi Kegiatan</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input label="Nama Event / Kegiatan" value={settings.nama_event ?? ""} onChange={(e) => setSettings({ ...settings, nama_event: e.target.value })} placeholder="Qurban Idul Adha 1446H" />
            <Input label="Nama Panitia / Organisasi" value={settings.nama_panitia ?? ""} onChange={(e) => setSettings({ ...settings, nama_panitia: e.target.value })} placeholder="Panitia Qurban Masjid Al-Ikhlas" />
            <Textarea label="Alamat Lokasi Penyembelihan" value={settings.alamat_lokasi ?? ""} onChange={(e) => setSettings({ ...settings, alamat_lokasi: e.target.value })} placeholder="Jl. Merdeka No. 1..." />
            <Input label="Tanggal Pelaksanaan" type="date" value={settings.tanggal_pelaksanaan ?? ""} onChange={(e) => setSettings({ ...settings, tanggal_pelaksanaan: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Target Sapi (ekor)" type="number" min={0} value={settings.target_sapi ?? 0} onChange={(e) => setSettings({ ...settings, target_sapi: Number(e.target.value) })} />
              <Input label="Target Kambing (ekor)" type="number" min={0} value={settings.target_kambing ?? 0} onChange={(e) => setSettings({ ...settings, target_kambing: Number(e.target.value) })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</Button>
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><CheckCircle size={16} />Tersimpan!</span>}
      </div>
    </div>
  );
}
