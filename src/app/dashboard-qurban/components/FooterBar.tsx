const C = {
  gold:  '#e0b93a',
  muted: '#9fd49f',
  div:   '#2e6638',
} as const;

export function FooterBar({ panitia }: { panitia: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'linear-gradient(90deg,#0a2212,#0e2a16)',
      borderTop: `2px solid ${C.div}`,
      padding: '0 52px', gap: 32,
    }}>
      <div style={{
        fontFamily: "'Amiri', serif",
        fontSize: 17, color: C.gold, flex: 1,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        &ldquo;فَصَلِّ لِرَبِّكَ وَانْحَرْ&rdquo; &mdash; Maka dirikanlah shalat karena Tuhanmu dan berkurbanlah. (QS. Al-Kautsar: 2)
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>
        {panitia} &middot; Masjid Darul Husna Warungboto
      </div>
    </div>
  );
}
