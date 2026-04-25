'use client';

import { useEffect, useRef } from 'react';

const C = {
  bg2:   '#214d2a',
  gold:  '#e0b93a',
  text:  '#f0fdf0',
  muted: '#9fd49f',
  div:   '#2e6638',
} as const;

const ROW_H = 66;
const SPEED = 0.6;

export interface DistribusiRow {
  id: string;
  nama_penerima: string;
  alamat: string | null;
  jumlah_paket: number;
  berat_kg: number | null;
}

export function DistribusiScrollList({ rows }: { rows: DistribusiRow[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const yRef     = useRef(0);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    yRef.current = 0;
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
        Belum ada data distribusi
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <div ref={trackRef} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[...rows, ...rows].map((d, i) => {
          const idx = i % rows.length;
          return (
            <div
              key={`${d.id}-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 220px 130px 130px',
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
                {d.nama_penerima}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {d.alamat ?? '—'}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block', padding: '5px 14px', borderRadius: 99,
                  fontSize: 13, fontWeight: 700, letterSpacing: '.5px',
                  background: 'rgba(224,185,58,.15)',
                  color: C.gold,
                  border: '1px solid rgba(224,185,58,.3)',
                }}>
                  {d.jumlah_paket} paket
                </span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, color: C.text }}>
                {d.berat_kg != null ? `${d.berat_kg} kg` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
