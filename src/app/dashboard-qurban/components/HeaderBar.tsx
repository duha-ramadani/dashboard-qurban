const C = {
  bg2:    '#214d2a',
  green1: '#7ed444',
  gold:   '#e0b93a',
  text:   '#f0fdf0',
  muted:  '#9fd49f',
  div:    '#2e6638',
} as const;

const F = {
  main:   "'Plus Jakarta Sans', sans-serif",
  arabic: "'Amiri', serif",
} as const;

interface Props {
  timeStr: string;
  dateStr: string;
  hijriahStr?: string;
}

export function HeaderBar({ timeStr, dateStr, hijriahStr }: Props) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 52px', background: C.bg2, borderBottom: `2px solid ${C.div}`,
      position: 'relative', zIndex: 10, fontFamily: F.main,
    }}>
      {/* Logo + Mosque name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Logo MDH"
          style={{ height: 76, filter: 'drop-shadow(0 0 12px rgba(109,191,58,0.35))' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.green1, letterSpacing: '.5px', lineHeight: 1.2 }}>
            Masjid Darul Husna Warungboto
          </div>
          <div style={{ fontSize: 14, color: C.muted, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Jl. Veteran No. 148, Warungboto, Umbulharjo, Yogyakarta
          </div>
        </div>
      </div>

      {/* Center title */}
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ fontFamily: F.arabic, fontSize: 30, color: C.gold, lineHeight: 1, marginBottom: 4 }}>
          بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '.5px' }}>
          Dashboard Qurban Idul Adha
        </div>
        <div style={{ fontSize: 15, color: C.muted, fontWeight: 500, letterSpacing: '2px', marginTop: 2 }}>
          1447 Hijriyah &middot; 2026 Masehi
        </div>
      </div>

      {/* Clock */}
      <div style={{ textAlign: 'right', minWidth: 260 }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: C.green1, letterSpacing: '2px', lineHeight: 1 }}>
          {timeStr}
        </div>
        {hijriahStr && (
          <div style={{ fontSize: 14, color: C.gold, fontWeight: 600, marginTop: 3, letterSpacing: '.5px' }}>
            {hijriahStr}
          </div>
        )}
        <div style={{ fontSize: 14, color: C.muted, fontWeight: 500, marginTop: 2, letterSpacing: '.5px' }}>
          {dateStr}
        </div>
      </div>
    </header>
  );
}
