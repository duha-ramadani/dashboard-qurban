'use client';

import { useEffect, useRef } from 'react';

const C = {
  bg2:    '#214d2a',
  green1: '#7ed444',
  text:   '#f0fdf0',
  muted:  '#9fd49f',
  div:    '#2e6638',
} as const;

const ROW_H = 66;
const SPEED = 0.6;

export interface PesertaRow {
  id: string;
  nama: string;
  alamat: string | null;
  jenis_hewan: string;
  hewan: { status: string; nama_hewan: string | null } | null;
}

export function ScrollList({ rows }: { rows: PesertaRow[] }) {
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
          const namaHewan = p.hewan?.nama_hewan || (isSapi ? 'Sapi' : 'Kambing/Domba');
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
              <div style={{ fontSize: 14, fontWeight: 700, color: C.muted, textAlign: 'center' }}>
                {idx + 1}
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.nama}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.alamat ?? '—'}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block', padding: '5px 14px', borderRadius: 99,
                  fontSize: 13, fontWeight: 700, letterSpacing: '.5px',
                  background: isSapi ? 'rgba(109,191,58,.15)' : 'rgba(58,170,109,.15)',
                  color: isSapi ? C.green1 : '#4ec98a',
                  border: `1px solid ${isSapi ? 'rgba(109,191,58,.3)' : 'rgba(58,170,109,.3)'}`,
                }}>
                  {namaHewan}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.text }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: isDone ? C.green1 : C.muted,
                    boxShadow: isDone ? `0 0 6px ${C.green1}` : 'none',
                  }} />
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
