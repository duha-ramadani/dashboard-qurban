'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef, useState } from 'react';
import { FooterBar } from './components/FooterBar';
import { HeaderBar } from './components/HeaderBar';
import { LeftPanel } from './components/LeftPanel';
import { ScrollList } from './components/ScrollList';
import type { PesertaRow } from './components/ScrollList';

const C = { bg: '#1a3d22', bg2: '#214d2a', green1: '#7ed444', green2: '#3ec47e', div: '#2e6638' } as const;

interface HewanRow { jenis: string; status: string; }
interface DistribusiRow { jumlah_paket: number; berat_kg: number | null; }

function useScaleToFit(w = 1920, h = 1080) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    function update() { setScale(Math.min(window.innerWidth / w, window.innerHeight / h)); }
    window.addEventListener('resize', update);
    update();
    return () => window.removeEventListener('resize', update);
  }, [w, h]);
  return scale;
}

const DAYS_ID   = ['Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const JADWAL_TIMES = ['04:23','05:42','11:48','15:09','17:44','18:57'];

function getNextIdx(now: Date) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return JADWAL_TIMES.findIndex(t => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m > nowMin;
  });
}

export default function DashboardClient() {
  const supabase  = createClient();
  const scale     = useScaleToFit();
  const [now,        setNow]        = useState<Date | null>(null);
  const [hewan,      setHewan]      = useState<HewanRow[]>([]);
  const [peserta,    setPeserta]    = useState<PesertaRow[]>([]);
  const [distribusi, setDistribusi] = useState<DistribusiRow[]>([]);
  const [panitia,    setPanitia]    = useState('Panitia Qurban');
  const [showFs,     setShowFs]     = useState(true);
  const [isFs,       setIsFs]       = useState(false);
  const fsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Clock
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Data + Realtime
  useEffect(() => {
    async function load() {
      const [h, p, d, s] = await Promise.all([
        supabase.from('hewan').select('jenis, status'),
        supabase.from('peserta').select('id, nama, alamat, jenis_hewan, hewan(status, nama_hewan)').order('created_at'),
        supabase.from('distribusi').select('jumlah_paket, berat_kg'),
        supabase.from('settings').select('nama_panitia').limit(1).single(),
      ]);
      if (h.data) setHewan(h.data);
      if (p.data) setPeserta(p.data as unknown as PesertaRow[]);
      if (d.data) setDistribusi(d.data);
      if (s.data?.nama_panitia) setPanitia(s.data.nama_panitia);
    }
    load();
    const ch = supabase
      .channel('display-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hewan' },      load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta' },    load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'distribusi' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fullscreen auto-hide
  useEffect(() => {
    function show() {
      setShowFs(true);
      if (fsTimer.current) clearTimeout(fsTimer.current);
      fsTimer.current = setTimeout(() => setShowFs(false), 3000);
    }
    document.addEventListener('mousemove', show);
    show();
    return () => {
      document.removeEventListener('mousemove', show);
      if (fsTimer.current) clearTimeout(fsTimer.current);
    };
  }, []);

  useEffect(() => {
    function onChange() { setIsFs(!!document.fullscreenElement); }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Computed stats
  const sapiTotal      = hewan.filter(h => h.jenis === 'sapi').length;
  const kambingTotal   = hewan.filter(h => h.jenis === 'kambing_domba').length;
  const sapiDone       = hewan.filter(h => h.jenis === 'sapi'          && h.status === 'sudah_disembelih').length;
  const kambingDone    = hewan.filter(h => h.jenis === 'kambing_domba' && h.status === 'sudah_disembelih').length;
  const sapiPeserta    = peserta.filter(p => p.jenis_hewan === 'sapi').length;
  const kambingPeserta = peserta.filter(p => p.jenis_hewan === 'kambing_domba').length;
  const totalPaket     = distribusi.reduce((s, d) => s + d.jumlah_paket, 0);
  const totalBerat     = distribusi.reduce((s, d) => s + (d.berat_kg ?? 0), 0);

  // Clock
  const timeStr = now
    ? [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':')
    : '00:00:00';
  const dateStr = now
    ? `${DAYS_ID[now.getDay()]}, ${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`
    : '—';
  const nextIdx = now ? getNextIdx(now) : -1;

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: 1920, height: 1080,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        background: C.bg, color: '#f0fdf0',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -100, right: 200, width: 600, height: 600, borderRadius: '50%', background: C.green1, filter: 'blur(120px)', opacity: 0.07, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 100, width: 400, height: 400, borderRadius: '50%', background: C.green2, filter: 'blur(120px)', opacity: 0.07, pointerEvents: 'none' }} />

        {/* Root grid */}
        <div style={{ display: 'grid', gridTemplateRows: '110px 1fr 44px', width: 1920, height: 1080 }}>

          <HeaderBar timeStr={timeStr} dateStr={dateStr} />

          {/* Body */}
          <div style={{ display: 'grid', gridTemplateColumns: '680px 1fr', overflow: 'hidden' }}>
            <LeftPanel
              sapiTotal={sapiTotal}
              kambingTotal={kambingTotal}
              sapiPeserta={sapiPeserta}
              kambingPeserta={kambingPeserta}
              sapiDone={sapiDone}
              kambingDone={kambingDone}
              totalDone={sapiDone + kambingDone}
              totalHewan={hewan.length}
              totalPaket={totalPaket}
              totalBerat={totalBerat}
              nextIdx={nextIdx}
            />

            {/* Right panel */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '28px 52px 28px 40px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '.5px' }}>
                  Daftar Shohibul Qurban
                </div>
                <div style={{ fontSize: 16, color: '#9fd49f', fontWeight: 600, background: C.bg2, border: `1px solid ${C.div}`, borderRadius: 99, padding: '6px 20px' }}>
                  {peserta.length} Shohibul Qurban
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 220px 130px 160px', gap: '0 16px', padding: '12px 20px', background: C.bg2, borderRadius: 10, marginBottom: 10, flexShrink: 0 }}>
                {([['No','center'],['Nama Shohibul Qurban','left'],['Alamat','left'],['Hewan','right'],['Status','right']] as const).map(([col, align]) => (
                  <div key={col} style={{ fontSize: 18, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9fd49f', textAlign: align }}>{col}</div>
                ))}
              </div>
              <ScrollList rows={peserta} />
            </div>
          </div>

          <FooterBar panitia={panitia} />
        </div>
      </div>

      {/* Fullscreen button */}
      <button
        onClick={() => {
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen();
        }}
        style={{
          position: 'fixed', bottom: 52, right: 24, zIndex: 999,
          background: C.bg2, border: `1.5px solid ${C.div}`, borderRadius: 12,
          color: '#9fd49f', fontSize: 13, fontWeight: 700, letterSpacing: '1px',
          padding: '10px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          opacity: showFs ? 1 : 0,
          pointerEvents: showFs ? 'auto' : 'none',
          transition: 'opacity .4s',
        }}
      >
        {isFs ? '✕ Keluar Fullscreen' : '⛶ Fullscreen'}
      </button>
    </>
  );
}
