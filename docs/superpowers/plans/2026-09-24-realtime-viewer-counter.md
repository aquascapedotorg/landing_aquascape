# Realtime Viewer Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menampilkan jumlah orang yang sedang membuka landing page secara realtime sebagai badge "N View/Views" di header.

**Architecture:** Satu channel Supabase Realtime Presence global (`aquascape-presence`); setiap tab track dirinya, angka = jumlah entri unik pada `presenceState()`, turun otomatis saat tab tutup. Fungsi murni `countViewers()` diuji tanpa jaringan. Komponen React `ViewerCounter` menampilkan badge dan tersembunyi kalau Supabase tak terkonfigurasi.

**Tech Stack:** React 19, TypeScript, Vite, `@supabase/supabase-js` (Realtime Presence), lucide-react, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-09-24-realtime-viewer-counter-design.md`

## Global Constraints

- Reuse `getFishDataSourceConfig()` dari `src/services/supabaseFishService.ts` untuk membaca kredensial Supabase (jangan buat pembacaan env baru).
- Tanpa tabel DB baru, tanpa server baru — hanya Realtime Presence.
- Fallback aman: jika kredensial kosong / gagal connect → `count = 0` dan badge tidak dirender. Situs tidak boleh rusak karena fitur ini.
- Teks badge: `1 View` (tunggal), `N Views` (jamak, untuk N > 1).
- Test command: `npm test` (vitest). Type-check: `npm run lint` (tsc --noEmit).

---

### Task 1: presenceService (fungsi murni + subscription)

**Files:**
- Create: `src/services/presenceService.ts`
- Test: `src/services/presenceService.test.ts`

**Interfaces:**
- Consumes: `getFishDataSourceConfig()` dari `./supabaseFishService` → `{ supabaseUrl?: string; supabaseAnonKey?: string }`; `createClient` dari `@supabase/supabase-js`.
- Produces:
  - `countViewers(presenceState: Record<string, unknown[]>): number`
  - `subscribeToViewerCount(onCountChange: (count: number) => void): () => void`

- [ ] **Step 1: Write the failing test**

```ts
// src/services/presenceService.test.ts
import { describe, it, expect } from 'vitest';
import { countViewers } from './presenceService';

describe('countViewers', () => {
  it('returns 0 for an empty presence state', () => {
    expect(countViewers({})).toBe(0);
  });

  it('counts each distinct presence key as one viewer', () => {
    const state = {
      'key-a': [{ online_at: 1 }],
      'key-b': [{ online_at: 2 }],
      'key-c': [{ online_at: 3 }],
    };
    expect(countViewers(state)).toBe(3);
  });

  it('counts a key once even if it has multiple presence entries', () => {
    const state = {
      'key-a': [{ online_at: 1 }, { online_at: 2 }],
      'key-b': [{ online_at: 3 }],
    };
    expect(countViewers(state)).toBe(2);
  });

  it('ignores keys whose presence list is empty', () => {
    const state = {
      'key-a': [{ online_at: 1 }],
      'key-empty': [],
    };
    expect(countViewers(state)).toBe(1);
  });

  it('returns 0 for null/undefined input', () => {
    // @ts-expect-error testing defensive path
    expect(countViewers(null)).toBe(0);
    // @ts-expect-error testing defensive path
    expect(countViewers(undefined)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- presenceService`
Expected: FAIL — `countViewers` tidak ditemukan (module belum ada).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/services/presenceService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getFishDataSourceConfig } from './supabaseFishService';

/**
 * Menghitung jumlah viewer unik dari objek presenceState Supabase.
 * Setiap KEY presence = satu viewer (satu tab), walau punya banyak entri.
 * Fungsi murni: tidak menyentuh jaringan, mudah diuji.
 */
export function countViewers(presenceState: Record<string, unknown[]>): number {
  if (!presenceState || typeof presenceState !== 'object') return 0;
  let total = 0;
  for (const key of Object.keys(presenceState)) {
    const entries = presenceState[key];
    if (Array.isArray(entries) && entries.length > 0) {
      total += 1;
    }
  }
  return total;
}

/**
 * Satu channel presence global untuk seluruh lifetime app. subscribeToViewerCount
 * dipanggil dari React effect yang bisa berjalan berkali-kali (StrictMode/HMR),
 * jadi kita jaga hanya SATU channel: pemanggilan ulang cukup menukar callback.
 */
interface ActivePresence {
  supabase: SupabaseClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel: any;
  onCountChange: (count: number) => void;
}

let activePresence: ActivePresence | null = null;

const CHANNEL_NAME = 'aquascape-presence';

function randomKey(): string {
  return `viewer_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

/**
 * Buka channel presence, track diri sendiri, dengarkan 'sync', dan panggil
 * onCountChange dengan jumlah viewer terbaru. Mengembalikan fungsi cleanup.
 *
 * Fallback aman: jika kredensial Supabase kosong / gagal → onCountChange(0)
 * dan cleanup no-op (badge akan tersembunyi).
 */
export function subscribeToViewerCount(
  onCountChange: (count: number) => void
): () => void {
  const { supabaseUrl, supabaseAnonKey } = getFishDataSourceConfig();

  // Config kosong → tidak ada presence. Badge tersembunyi.
  if (!supabaseUrl || !supabaseAnonKey) {
    onCountChange(0);
    return () => {};
  }

  // Sudah ada channel hidup: cukup tukar callback dan kirim angka terkini.
  if (activePresence) {
    activePresence.onCountChange = onCountChange;
    try {
      onCountChange(countViewers(activePresence.channel.presenceState()));
    } catch {
      onCountChange(0);
    }
    return () => {};
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: randomKey() } },
    });

    const sub: ActivePresence = { supabase, channel, onCountChange };
    activePresence = sub;

    channel
      .on('presence', { event: 'sync' }, () => {
        const current = activePresence;
        if (!current) return;
        try {
          current.onCountChange(countViewers(current.channel.presenceState()));
        } catch {
          current.onCountChange(0);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ online_at: Date.now() }).catch(() => {});
        }
      });

    return () => {
      // No-op saat re-render: channel process-global dijaga tetap hidup
      // (pola sama seperti supabaseFishService). Teardown nyata saat unload.
    };
  } catch (err) {
    console.warn('[Aquascape Presence] setup error:', err);
    onCountChange(0);
    return () => {};
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- presenceService`
Expected: PASS (semua kasus `countViewers`).

- [ ] **Step 5: Type-check**

Run: `npm run lint`
Expected: tidak ada error TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/services/presenceService.ts src/services/presenceService.test.ts
git commit -m "feat(presence): add realtime viewer count service"
```

---

### Task 2: ViewerCounter component + integrasi Header

**Files:**
- Create: `src/components/ViewerCounter.tsx`
- Modify: `src/components/Header.tsx` (tambah import + render `<ViewerCounter />` di dalam `<nav>` sebelum tombol sound)

**Interfaces:**
- Consumes: `subscribeToViewerCount` dari `../services/presenceService`; `Eye` dari `lucide-react`.
- Produces: `export const ViewerCounter: React.FC` (tanpa props).

- [ ] **Step 1: Tulis komponen**

```tsx
// src/components/ViewerCounter.tsx
import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { subscribeToViewerCount } from '../services/presenceService';

/**
 * Badge realtime "N View/Views". Menampilkan jumlah orang yang sedang membuka
 * situs (Supabase Presence). Tersembunyi bila Supabase tidak terkonfigurasi
 * atau belum ada viewer (count <= 0), agar tidak menampilkan angka palsu.
 */
export const ViewerCounter: React.FC = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToViewerCount(setCount);
    return unsubscribe;
  }, []);

  if (count <= 0) return null;

  const label = count === 1 ? 'View' : 'Views';

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
      title="Sedang menonton sekarang"
      aria-live="polite"
      aria-label={`${count} ${label} sedang menonton`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <Eye className="w-4 h-4" />
      <span className="text-xs font-semibold tabular-nums">
        {count} {label}
      </span>
    </div>
  );
};
```

- [ ] **Step 2: Integrasikan ke Header**

Di `src/components/Header.tsx`, tambahkan import di dekat import lain:

```tsx
import { ViewerCounter } from './ViewerCounter';
```

Lalu di dalam `<nav className="flex items-center gap-3 sm:gap-5">`, tambahkan sebagai anak pertama, tepat sebelum komentar `{/* Quick Sound Toggle in Header */}`:

```tsx
          {/* Realtime viewer count */}
          <ViewerCounter />

```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: tidak ada error TypeScript.

- [ ] **Step 4: Verifikasi build/test hijau**

Run: `npm test`
Expected: seluruh test suite PASS (tidak ada regresi).

- [ ] **Step 5: Commit**

```bash
git add src/components/ViewerCounter.tsx src/components/Header.tsx
git commit -m "feat(header): show realtime viewer counter badge"
```

---

## Verifikasi manual (setelah kedua task)

- Jalankan `npm run dev`, buka `http://localhost:3000`. Dengan `.env` Supabase terisi,
  badge muncul menampilkan minimal "1 View".
- Buka tab kedua → angka naik ke "2 Views" di kedua tab dalam ~1 detik.
- Tutup satu tab → angka turun kembali.
- Tanpa `.env` Supabase → badge tidak muncul, situs normal.
