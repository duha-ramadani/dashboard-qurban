# Handoff: Dashboard Qurban Idul Adha – Masjid Darul Husna Warungboto

## Overview
Dashboard fullscreen (1920×1080) untuk ditampilkan di monitor 40" selama pelaksanaan Qurban Idul Adha. Menampilkan rekap hewan qurban, progres penyembelihan, daftar shohibul qurban dengan auto-scroll, paket daging, jadwal sholat, dan jam berjalan secara real-time.

## About the Design Files
File `Dashboard Qurban.html` adalah **design reference berbasis HTML** — prototipe high-fidelity yang menunjukkan tampilan dan perilaku akhir yang diinginkan. Tugas developer adalah **merekrasi desain ini di dalam codebase Next.js yang sudah ada**, menggunakan pola dan library yang sudah ditetapkan, bukan menggunakan file HTML ini secara langsung di production.

## Fidelity
**High-fidelity (hifi)** — Pixel-perfect mockup dengan warna, tipografi, spacing, dan interaksi final. Developer harus merekrasi UI ini secara pixel-perfect menggunakan library dan pola yang sudah ada di codebase.

---

## Tech Stack Target
| Layer | Teknologi |
|---|---|
| Frontend | Next.js (App Router) |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime (WebSocket subscriptions) |
| Hosting | Vercel |
| Auth | Tidak diperlukan (display-only) |

---

## Supabase Database Schema

> ⚠️ **PENTING:** Tabel-tabel berikut **sudah ada** di Supabase project ini. **Jangan buat tabel baru.** Gunakan tabel yang sudah ada dan sesuaikan query/mapping-nya.

| Nama Tabel di Design | Nama Tabel Aktual di Supabase |
|---|---|
| `hewan_qurban` | `hewan` |
| `shohibul_qurban` | `peserta` |
| `paket_daging` | `distribusi` |
| `jadwal_sholat` | Buat baru jika belum ada |

**Langkah yang harus dilakukan Claude Code:**
1. Inspect schema tabel `hewan`, `peserta`, dan `distribusi` yang sudah ada (via Supabase Studio atau `information_schema`)
2. Petakan kolom-kolom yang ada ke kebutuhan dashboard (nama, status sembelih, jenis hewan, dsb)
3. Sesuaikan semua query dan Realtime subscription dengan nama tabel & kolom aktual
4. Jangan asumsikan nama kolom — selalu cek schema dulu sebelum menulis query

### Data yang dibutuhkan dashboard dari tiap tabel:

**Dari tabel `hewan`** (ex: `hewan_qurban`):
- Jenis hewan (sapi / kambing)
- Jumlah total ekor per jenis
- Jumlah yang sudah disembelih per jenis

**Dari tabel `peserta`** (ex: `shohibul_qurban`):
- Nomor urut
- Nama lengkap
- Alamat
- Jenis hewan yang diqurbankan
- Status sudah/belum disembelih

**Dari tabel `distribusi`** (ex: `paket_daging`):
- Total paket daging
- Jumlah paket yang sudah dibagikan
- Total berat (kg) yang sudah dibagikan

---

## Struktur Halaman Next.js

Buat route baru: `app/dashboard-qurban/page.tsx`

Ini adalah **Server Component** yang mem-fetch data awal, lalu meng-hydrate ke **Client Component** yang subscribe ke Supabase Realtime.

```
app/
  dashboard-qurban/
    page.tsx              ← Server Component (fetch awal)
    DashboardClient.tsx   ← Client Component (realtime + rendering)
    components/
      HeaderBar.tsx
      StatCard.tsx
      ProgressSection.tsx
      PaketDagingCard.tsx
      ShohibulList.tsx
      JadwalSholat.tsx
      ClockDisplay.tsx
```

---

## Komponen & Layout

### Layout Utama
```
root (1920×1080, grid: 110px header + 1fr body + 44px footer)
├── <HeaderBar>       (110px tinggi)
├── body (grid: 680px left | 1fr right)
│   ├── <LeftPanel>
│   │   ├── "REKAP HEWAN QURBAN" label
│   │   ├── <StatCard> Sapi
│   │   ├── <StatCard> Kambing
│   │   ├── <ProgressSection> Penyembelihan
│   │   ├── <PaketDagingCard>
│   │   └── <JadwalSholat>
│   └── <RightPanel>
│       ├── Header "Daftar Shohibul Qurban"
│       ├── Column headers
│       └── <ShohibulList> (auto-scroll)
└── <Footer> (44px)
```

### Design Tokens
```ts
// tokens.ts
export const colors = {
  bg:       '#1a3d22',
  bg2:      '#214d2a',
  bg3:      '#265a30',
  green1:   '#7ed444',   // accent utama
  green2:   '#3ec47e',   // accent sekunder
  gold:     '#e0b93a',
  goldDim:  '#b08a2a',
  text:     '#f0fdf0',
  muted:    '#9fd49f',
  divider:  '#2e6638',
};

export const fonts = {
  main:   "'Plus Jakarta Sans', sans-serif",
  arabic: "'Amiri', serif",
};

export const radius = {
  card: '18px',
  badge: '99px',
  row: '12px',
};
```

---

## Realtime Integration (Supabase)

Gunakan `supabase-js` dengan channel subscription:

```ts
// DashboardClient.tsx (ringkasan)
'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardClient({ initialData }) {
  const [shohibulList, setShohibulList] = useState(initialData.shohibul);
  const [stats, setStats] = useState(initialData.stats);

  useEffect(() => {
    // Subscribe ke perubahan tabel shohibul_qurban
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shohibul_qurban'
      }, (payload) => {
        // Refresh list saat ada INSERT/UPDATE/DELETE
        fetchShohibul().then(setShohibulList);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'paket_daging'
      }, (payload) => {
        fetchStats().then(setStats);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ... render
}
```

> **Penting:** Aktifkan Supabase Realtime di dashboard Supabase → Table Editor → klik tabel → enable Realtime.

---

## Auto-scroll Shohibul Qurban

List shohibul qurban harus scroll otomatis dan loop tanpa henti:

```ts
// Gunakan requestAnimationFrame
useEffect(() => {
  let scrollY = 0;
  const SPEED = 0.6; // px per frame
  const ROW_HEIGHT = 66;
  const loopHeight = data.length * ROW_HEIGHT;
  let raf: number;

  function step() {
    scrollY += SPEED;
    if (scrollY >= loopHeight) scrollY = 0;
    trackRef.current.style.transform = `translateY(-${scrollY}px)`;
    raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}, [data.length]);
```
Render data dua kali (original + clone) untuk seamless loop.

---

## Fullscreen API

```ts
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}
```
Tombol fullscreen auto-hide setelah 3 detik tidak ada aktivitas mouse.

---

## Live Clock

```ts
useEffect(() => {
  const timer = setInterval(() => {
    setNow(new Date());
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

---

## Jadwal Sholat Highlight Otomatis

Bandingkan waktu sekarang dengan array jadwal untuk menentukan waktu sholat berikutnya:

```ts
function getNextSholatIndex(jadwal: {waktu: string}[]) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return jadwal.findIndex(s => {
    const [h, m] = s.waktu.split(':').map(Number);
    return h * 60 + m > nowMin;
  });
}
```

---

## Skalasi Fullscreen (1920×1080)

Karena halaman didesain fixed 1920×1080, gunakan CSS transform scale agar muat di semua ukuran layar:

```ts
// useScaleToFit.ts
import { useEffect, useState } from 'react';

export function useScaleToFit(designW = 1920, designH = 1080) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const scaleX = window.innerWidth / designW;
      const scaleY = window.innerHeight / designH;
      setScale(Math.min(scaleX, scaleY));
    }
    window.addEventListener('resize', update);
    update();
    return () => window.removeEventListener('resize', update);
  }, [designW, designH]);

  return scale;
}

// Usage di page.tsx:
// style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
```

---

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## Assets
| File | Keterangan |
|---|---|
| `assets/LOGO_MDH.png` | Logo Masjid Darul Husna — letakkan di `public/images/LOGO_MDH.png` |

Font yang digunakan (tambahkan di `app/layout.tsx`):
```ts
import { Plus_Jakarta_Sans } from 'next/font/google';
// Amiri untuk teks Arab (bismillah, footer ayat)
```

---

## Checklist Implementasi
- [ ] Buat tabel Supabase sesuai schema di atas
- [ ] Enable Realtime di semua tabel
- [ ] Buat route `app/dashboard-qurban/page.tsx`
- [ ] Implementasi komponen sesuai struktur di atas
- [ ] Sambungkan Supabase Realtime subscription
- [ ] Test auto-scroll seamless loop
- [ ] Test fullscreen API di Chrome (browser monitor)
- [ ] Set `viewport` Next.js agar tidak zoom di layar besar
- [ ] Deploy ke Vercel & set env vars

---

## File Referensi
| File | Keterangan |
|---|---|
| `Dashboard Qurban.html` | Design reference lengkap (HTML + CSS + JS inline) |
| `assets/LOGO_MDH.png` | Logo masjid |
| `README.md` | Dokumen ini |

---

*Handoff dibuat oleh Claude · Proyek: Dashboard Qurban Idul Adha 1447H – Masjid Darul Husna Warungboto*
