const C = {
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

const glow = '0 0 32px rgba(126,212,68,0.15)';

export interface JadwalSholat {
  nama: string;
  waktu: string;
  icon: string;
}

interface Props {
  sapiTotal: number;
  kambingTotal: number;
  sapiPeserta: number;
  kambingPeserta: number;
  sapiDone: number;
  kambingDone: number;
  totalDone: number;
  totalHewan: number;
  totalPaket: number;
  totalBerat: number;
  nextIdx: number;
  jadwal: JadwalSholat[];
}

function pct(done: number, total: number) {
  return total > 0 ? `${(done / total) * 100}%` : '0%';
}

export function LeftPanel({
  sapiTotal, kambingTotal,
  sapiPeserta, kambingPeserta,
  sapiDone, kambingDone,
  totalDone, totalHewan,
  totalPaket, totalBerat,
  nextIdx, jadwal,
}: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 20,
      padding: '28px 32px 28px 52px',
      borderRight: `2px solid ${C.div}`,
      overflow: 'hidden',
    }}>
      {/* Section label */}
      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: C.muted, flexShrink: 0 }}>
        Rekap Hewan Qurban
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flexShrink: 0 }}>
        {[
          { label: 'Sapi', count: sapiTotal, sub: `${sapiPeserta} shohibul qurban`, emoji: '🐄', accent: `linear-gradient(90deg,${C.green1},${C.green2})` },
          { label: 'Kambing / Domba', count: kambingTotal, sub: `${kambingPeserta} shohibul qurban`, emoji: '🐐', accent: `linear-gradient(90deg,${C.green2},#2dc4a0)` },
        ].map(({ label, count, sub, emoji, accent }) => (
          <div key={label} style={{ background: C.bg2, border: `1.5px solid ${C.div}`, borderRadius: 18, padding: '18px 24px 16px', position: 'relative', overflow: 'hidden', boxShadow: glow }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '18px 18px 0 0', background: accent }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1, color: C.text }}>
              {count} <span style={{ fontSize: 18, fontWeight: 600, color: C.muted, marginLeft: 4 }}>ekor</span>
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontWeight: 500 }}>{sub}</div>
            <div style={{ fontSize: 64, lineHeight: 1, position: 'absolute', right: 16, bottom: 10, opacity: 0.85, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>{emoji}</div>
          </div>
        ))}
      </div>

      {/* Progress penyembelihan */}
      <div style={{ background: C.bg2, border: `1.5px solid ${C.div}`, borderRadius: 18, padding: '20px 28px', boxShadow: glow, flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>
          Progres Penyembelihan
        </div>
        {[
          { name: '🐄 Sapi',            done: sapiDone,    total: sapiTotal },
          { name: '🐐 Kambing / Domba', done: kambingDone, total: kambingTotal },
          { name: '📦 Total Hewan',      done: totalDone,   total: totalHewan },
        ].map(({ name, done, total }, i, arr) => (
          <div key={name} style={{ marginBottom: i < arr.length - 1 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{name}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.green1 }}>
                {done} <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>/ {total} ekor</span>
              </div>
            </div>
            <div style={{ height: 10, background: C.bg3, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${C.green1},${C.green2})`, width: pct(done, total), transition: 'width 1.2s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Paket daging */}
      <div style={{ background: 'linear-gradient(135deg,#112a1a,#0e2215)', border: '1.5px solid #1e5030', borderRadius: 18, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0, boxShadow: glow }}>
        <div style={{ fontSize: 34, flexShrink: 0, alignSelf: 'center', lineHeight: 1 }}>{'🥩'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: C.muted, marginBottom: 2 }}>Paket Daging Dibagikan</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: C.gold, lineHeight: 1 }}>
            {totalPaket} <span style={{ fontSize: 18, fontWeight: 600, color: C.goldDim, marginLeft: 4 }}>paket</span>
          </div>
        </div>
        <div style={{ width: 1.5, background: C.div, height: 44, flexShrink: 0, alignSelf: 'center' }} />
        <div style={{ flexShrink: 0, textAlign: 'center', width: 110 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.green1, lineHeight: 1 }}>{totalBerat.toLocaleString('id-ID')}</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: '1px' }}>KG DIBAGIKAN</div>
        </div>
      </div>

      {/* Jadwal sholat */}
      <div style={{ background: C.bg2, border: `1.5px solid ${C.div}`, borderRadius: 18, padding: '24px 28px', boxShadow: glow, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12, flexShrink: 0 }}>
          Jadwal Sholat Hari Ini
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, minHeight: 0 }}>
          {jadwal.map((s, i) => {
            const active = i === nextIdx;
            return (
              <div key={s.nama} style={{
                background: active ? 'rgba(126,212,68,0.15)' : C.bg3,
                border: `1.5px solid ${active ? C.green1 : C.div}`,
                borderRadius: 12, padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
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
  );
}
