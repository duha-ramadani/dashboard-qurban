'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef, useState } from 'react';

const C = {
  bg:      '#1a3d22',
  bg2:     '#214d2a',
  bg3:     '#265a30',
  green1:  '#7ed444',
  green2:  '#3ec47e',
  gold:    '#e0b93a',
  goldDim: '#b08a2a',
  text:    '#f0fdf0',
  muted:   '#9fd49f',
  div:     '#2e6638',
} as const;

const F = {
  main:   "'Plus Jakarta Sans', sans-serif",
  arabic: "'Amiri', serif",
} as const;

const JADWAL = [
  { nama: 'Subuh',   waktu: '04:23', icon: '\u{1F319}' },
  { nama: 'Terbit',  waktu: '05:42', icon: '\u{1F304}' },
  { nama: 'Dzuhur',  waktu: '11:48', icon: '☀️' },
  { nama: 'Ashar',   waktu: '15:09', icon: '⛅' },
  { nama: 'Maghrib', waktu: '17:44', icon: '\u{1F305}' },
  { nama: 'Isya',    waktu: '18:57', icon: '\u{1F303}' },
];

const DAYS_ID   = ['Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

interface HewanRow     { jenis: string; status: string; }
interface PesertaRow   { id: string; nama: string; alamat: string | null; jenis_hewan: string; hewan: { status: string } | null; }
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

const ROW_H = 66;
const SPEED = 0.6;

function ScrollList({ rows }: { rows: PesertaRow[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const yRef     = useRef(0);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    if (!trackRef.current || rows.length === 0) return;
    const loop = rows.length * ROW_H;
    function step() {
      yRef.current += SPEED;
      if (yRef.current >= loop) yRef.current -= loop;
      if (trackRef.current) trackRef.current.style.transform = `translateY(-${yRef.current}px)`;
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rows.length]);

  if (rows.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 18 }}>
        Belum ada data shohibul qurban
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <div ref={trackRef} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[...rows, ...rows].map((p, i) => {
          const idx    = i % rows.length;
          const isSapi = p.jenis_hewan === 'sapi';
          const isDone = p.hewan?.status === 'sudah_disembelih';
          return (
            <div
              key={`${p.id}-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 220px 130px 160px',
                gap: '0 16px',
                alignItems: 'center',
                padding: '14px 20px',
                background: idx % 2 === 1 ? '#0d2115' : C.bg2,
                border: `1.5px solid ${C.div}`,
                borderRadius: 12,
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: C.muted, textAlign: 'center' }}>{idx + 1}</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nama}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.alamat ?? '—'}</div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block', padding: '5px 14px', borderRadius: 99,
                  fontSize: 13, fontWeight: 700, letterSpacing: '.5px',
                  background: isSapi ? 'rgba(109,191,58,.15)' : 'rgba(58,170,109,.15)',
                  color: isSapi ? C.green1 : '#4ec98a',
                  border: `1px solid ${isSapi ? 'rgba(109,191,58,.3)' : 'rgba(58,170,109,.3)'}`,
                }}>
                  {isSapi ? 'Sapi' : 'Kambing'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.text }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: isDone ? C.green1 : C.muted, boxShadow: isDone ? `0 0 6px ${C.green1}` : 'none' }} />
                  {isDone ? 'Sudah Disembelih' : 'Belum Disembelih'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const supabase = createClient();
  const scale    = useScaleToFit();
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
        supabase.from('peserta').select('id, nama, alamat, jenis_hewan, hewan(status)').order('created_at'),
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

  // Fullscreen button auto-hide
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

  // Stats
  const sapiTotal      = hewan.filter(h => h.jenis === 'sapi').length;
  const kambingTotal   = hewan.filter(h => h.jenis === 'kambing_domba').length;
  const sapiDone       = hewan.filter(h => h.jenis === 'sapi'          && h.status === 'sudah_disembelih').length;
  const kambingDone    = hewan.filter(h => h.jenis === 'kambing_domba' && h.status === 'sudah_disembelih').length;
  const totalDone      = sapiDone + kambingDone;
  const totalHewan     = hewan.length;
  const sapiPeserta    = peserta.filter(p => p.jenis_hewan === 'sapi').length;
  const kambingPeserta = peserta.filter(p => p.jenis_hewan === 'kambing_domba').length;
  const totalPaket     = distribusi.reduce((s, d) => s + d.jumlah_paket, 0);
  const totalBerat     = distribusi.reduce((s, d) => s + (d.berat_kg ?? 0), 0);

  // Clock display
  const timeStr = now
    ? [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':')
    : '00:00:00';
  const dateStr = now
    ? `${DAYS_ID[now.getDay()]}, ${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`
    : '—';
  const nextIdx = now ? (() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return JADWAL.findIndex(s => {
      const [hh, mm] = s.waktu.split(':').map(Number);
      return hh * 60 + mm > nowMin;
    });
  })() : -1;

  function pct(done: number, total: number) { return total > 0 ? `${(done / total) * 100}%` : '0%'; }

  const glow = '0 0 32px rgba(126,212,68,0.15)';

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left', background: C.bg, color: C.text, fontFamily: F.main, overflow: 'hidden' }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -100, right: 200, width: 600, height: 600, borderRadius: '50%', background: C.green1, filter: 'blur(120px)', opacity: 0.07, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 100, width: 400, height: 400, borderRadius: '50%', background: C.green2, filter: 'blur(120px)', opacity: 0.07, pointerEvents: 'none' }} />

        {/* Root grid: header | body | footer */}
        <div style={{ display: 'grid', gridTemplateRows: '110px 1fr 44px', width: 1920, height: 1080 }}>

          {/* ── HEADER ── */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 52px', background: C.bg2, borderBottom: `2px solid ${C.div}`, position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/LOGO_MDH.png"
                alt="Logo MDH"
                style={{ height: 76, filter: 'drop-shadow(0 0 12px rgba(109,191,58,0.35))' }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.green1, letterSpacing: '.5px', lineHeight: 1.2 }}>Masjid Darul Husna Warungboto</div>
                <div style={{ fontSize: 14, color: C.muted, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>Jl. Veteran No. 148, Warungboto, Umbulharjo, Yogyakarta</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: F.arabic, fontSize: 30, color: C.gold, lineHeight: 1, marginBottom: 4 }}>
                &#x628;&#x650;&#x633;&#x652;&#x645;&#x650; &#x627;&#x644;&#x644;&#x647;&#x650; &#x627;&#x644;&#x631;&#x651;&#x64E;&#x62D;&#x652;&#x645;&#x670;&#x646;&#x650; &#x627;&#x644;&#x631;&#x651;&#x64E;&#x62D;&#x650;&#x64A;&#x652;&#x645;&#x650;
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '.5px' }}>Dashboard Qurban Idul Adha</div>
              <div style={{ fontSize: 15, color: C.muted, fontWeight: 500, letterSpacing: '2px', marginTop: 2 }}>1447 Hijriyah &middot; 2026 Masehi</div>
            </div>

            <div style={{ textAlign: 'right', minWidth: 260 }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: C.green1, letterSpacing: '2px', lineHeight: 1 }}>{timeStr}</div>
              <div style={{ fontSize: 15, color: C.muted, fontWeight: 500, marginTop: 4, letterSpacing: '.5px' }}>{dateStr}</div>
            </div>
          </header>

          {/* ── BODY ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '680px 1fr', overflow: 'hidden' }}>

            {/* LEFT PANEL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '28px 32px 28px 52px', borderRight: `2px solid ${C.div}`, overflow: 'hidden' }}>

              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: C.muted }}>Rekap Hewan Qurban</div>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Sapi',             count: sapiTotal,    sub: `${sapiPeserta} shohibul qurban`,    emoji: '\u{1F404}', accent: `linear-gradient(90deg,${C.green1},${C.green2})` },
                  { label: 'Kambing / Domba', count: kambingTotal, sub: `${kambingPeserta} shohibul qurban`, emoji: '\u{1F410}', accent: `linear-gradient(90deg,${C.green2},#2dc4a0)` },
                ].map(({ label, count, sub, emoji, accent }) => (
                  <div key={label} style={{ background: C.bg2, border: `1.5px solid ${C.div}`, borderRadius: 18, padding: '22px 24px 20px', position: 'relative', overflow: 'hidden', boxShadow: glow }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '18px 18px 0 0', background: accent }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, color: C.text }}>
                      {count} <span style={{ fontSize: 22, fontWeight: 600, color: C.muted, marginLeft: 4 }}>ekor</span>
                    </div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 6, fontWeight: 500 }}>{sub}</div>
                    <div style={{ fontSize: 72, lineHeight: 1, position: 'absolute', right: 16, bottom: 12, opacity: 0.85, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>{emoji}</div>
                  </div>
                ))}
              </div>

              {/* Progress penyembelihan */}
              <div style={{ background: C.bg2, border: `1.5px solid ${C.div}`, borderRadius: 18, padding: '24px 28px', boxShadow: glow, flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>\u{1F4CB} Progres Penyembelihan</div>
                {[
                  { name: '\u{1F404} Sapi',            done: sapiDone,   total: sapiTotal },
                  { name: '\u{1F410} Kambing / Domba', done: kambingDone, total: kambingTotal },
                  { name: '\u{1F4E6} Total Hewan',      done: totalDone,  total: totalHewan },
                ].map(({ name, done, total }, i, arr) => (
                  <div key={name} style={{ marginBottom: i < arr.length - 1 ? 18 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{name}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.green1 }}>
                        {done} <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>/ {total} ekor</span>
                      </div>
                    </div>
                    <div style={{ height: 14, background: C.bg3, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${C.green1},${C.green2})`, width: pct(done, total), transition: 'width 1.2s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Paket daging */}
              <div style={{ background: 'linear-gradient(135deg,#112a1a,#0e2215)', border: '1.5px solid #1e5030', borderRadius: 18, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0, boxShadow: glow }}>
                <div style={{ fontSize: 38, flexShrink: 0, alignSelf: 'center', lineHeight: 1 }}>\u{1F969}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Paket Daging Dibagikan</div>
                  <div style={{ fontSize: 44, fontWeight: 800, color: C.gold, lineHeight: 1 }}>
                    {totalPaket} <span style={{ fontSize: 20, fontWeight: 600, color: C.goldDim, marginLeft: 4 }}>paket</span>
                  </div>
                </div>
                <div style={{ width: 1.5, background: C.div, height: 50, flexShrink: 0, alignSelf: 'center' }} />
                <div style={{ flexShrink: 0, textAlign: 'center', width: 110 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.green1, lineHeight: 1 }}>{totalBerat.toLocaleString('id-ID')}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: '1px' }}>KG DIBAGIKAN</div>
                </div>
              </div>

              {/* Jadwal Sholat */}
              <div style={{ background: C.bg2, border: `1.5px solid ${C.div}`, borderRadius: 18, padding: '24px 28px', boxShadow: glow, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>\u{1F54C} Jadwal Sholat Hari Ini</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, minHeight: 0 }}>
                  {JADWAL.map((s, i) => {
                    const active = i === nextIdx;
                    return (
                      <div key={s.nama} style={{ background: active ? 'rgba(126,212,68,0.15)' : C.bg3, border: `1.5px solid ${active ? C.green1 : C.div}`, borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 28, lineHeight: 1 }}>{s.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: active ? C.green1 : C.muted }}>
                            {s.nama}{active ? ' · Berikutnya' : ''}
                          </div>
                          <div style={{ fontSize: 30, fontWeight: 800, color: active ? C.text : C.muted, lineHeight: 1.1 }}>{s.waktu}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '28px 52px 28px 40px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '.5px' }}>\u{1F54C} Daftar Shohibul Qurban</div>
                <div style={{ fontSize: 16, color: C.muted, fontWeight: 600, background: C.bg2, border: `1px solid ${C.div}`, borderRadius: 99, padding: '6px 20px' }}>
                  {peserta.length} Shohibul Qurban
                </div>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 220px 130px 160px', gap: '0 16px', padding: '12px 20px', background: C.bg2, borderRadius: 10, marginBottom: 10, flexShrink: 0 }}>
                {(['No', 'Nama Shohibul Qurban', 'Alamat', 'Hewan', 'Status'] as const).map((col, i) => (
                  <div key={col} style={{ fontSize: 18, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.muted, textAlign: i === 0 ? 'center' : i >= 3 ? 'right' : 'left' }}>
                    {col}
                  </div>
                ))}
              </div>

              <ScrollList rows={peserta} />
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(90deg,#0a2212,#0e2a16)', borderTop: `2px solid ${C.div}`, padding: '0 52px', gap: 32 }}>
            <div style={{ fontFamily: F.arabic, fontSize: 17, color: C.gold, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              &#x201C;&#x641;&#x64E;&#x635;&#x64E;&#x644;&#x650;&#x651; &#x644;&#x650;&#x631;&#x64E;&#x628;&#x651;&#x650;&#x643;&#x64E; &#x648;&#x64E;&#x627;&#x646;&#x652;&#x62D;&#x64E;&#x631;&#x652;&#x201D; &#x2014; Maka dirikanlah shalat karena Tuhanmu dan berkurbanlah. (QS. Al-Kautsar: 2)
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {panitia} &middot; Masjid Darul Husna Warungboto
            </div>
          </div>
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
          color: C.muted, fontSize: 13, fontWeight: 700, letterSpacing: '1px',
          padding: '10px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.main,
          opacity: showFs ? 1 : 0, pointerEvents: showFs ? 'auto' : 'none',
          transition: 'opacity .4s, background .2s, color .2s, border-color .2s',
        }}
      >
        {isFs ? '✕ Keluar Fullscreen' : '⛶ Fullscreen'}
      </button>
    </>
  );
}
