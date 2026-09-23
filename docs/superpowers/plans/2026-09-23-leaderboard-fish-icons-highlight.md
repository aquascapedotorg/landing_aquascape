# Leaderboard Fish Icons + Click/Hover Highlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a species icon beside each leaderboard name, and let hovering a row glow its fish on the canvas while clicking a row spotlights it in place.

**Architecture:** `computeLeaderboard` gains a `species` field (from each participant's latest attendance row). A new `FishSpeciesIcon` SVG component renders per-species heads in the drawer. A highlight bridge on `aquascapeEvents` (`highlightFish`/`clearFishHighlight`) lets the drawer mark fish; the canvas render loop draws a glow (hover) or a strong glow + pulsing marker + forced nametag (click, time-decayed) on matching particles.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest, HTML Canvas 2D, inline SVG.

**Spec:** `docs/superpowers/specs/2026-09-23-leaderboard-fish-icons-highlight-design.md`

## Global Constraints

- Feature lives in Zen mode (where the drawer is) and is used in Supabase mode.
- No emojis anywhere. Icons are inline SVG paths; crowns/markers are SVG or canvas paths.
- Name matching between drawer and canvas uses `normalizeName` (exported from `streakCalculations.ts`) so whitespace variants still match.
- Species default is `neonTetra` when unknown/empty (via `normalizeFishSpecies`).
- Click highlight lasts 4000 ms and decays by wall-clock comparison in the render loop (no separate timer). Hover highlight is set on enter and cleared on leave.
- `streakCalculations.ts` stays pure (no I/O). `normalizeFishSpecies` is a pure mapping, so importing it there is allowed.
- Run tests with `npx vitest run`; typecheck with `npx tsc --noEmit`. Both pass before each commit.

---

## File Structure

- **Modify:** `src/services/streakCalculations.ts` — `AttendanceRow.species?`, `LeaderboardEntry.species`, pick latest-created_at species per name.
- **Modify:** `src/services/streakCalculations.test.ts` — species tests.
- **Modify:** `src/services/streakService.ts` — select `species` from communal_fishes.
- **Create:** `src/components/FishSpeciesIcon.tsx` — per-species inline SVG.
- **Modify:** `src/types.ts` — `FishParticle.hovered?`, `FishParticle.highlightUntil?`.
- **Modify:** `src/components/aquascapeEvents.ts` — provider `highlightFish`/`clearFishHighlight` + manager methods.
- **Modify:** `src/components/AquascapeCanvas.tsx` — implement provider fns + render glow/marker.
- **Modify:** `src/components/StreakLeaderboardDrawer.tsx` — icon + hover/click handlers.

---

## Task 1: Add `species` to leaderboard calculation

**Files:**
- Modify: `src/services/streakCalculations.ts`
- Modify: `src/services/streakCalculations.test.ts`

**Interfaces:**
- Consumes: `normalizeFishSpecies` from `./supabaseFishService` (pure mapping string→FishSpeciesType), `FishSpeciesType` from `../types`.
- Produces: `AttendanceRow.species?: string | null`; `LeaderboardEntry.species: FishSpeciesType`.

- [ ] **Step 1: Write the failing tests**

Append to `src/services/streakCalculations.test.ts` (before the final line if the file ends with a describe; otherwise at end):

```ts
describe('computeLeaderboard species', () => {
  it('uses the species from the latest-created_at attendance row', () => {
    const att = [
      { name: 'Budi', entry_date: '2026-02-16', created_at: '2026-02-16T08:00:00Z', species: 'shark' },
      { name: 'Budi', entry_date: '2026-02-17', created_at: '2026-02-17T08:00:00Z', species: 'whale' },
    ];
    const [row] = computeLeaderboard(att, [], '2026-02-17', new Set());
    expect(row.species).toBe('whale'); // latest created_at wins
  });

  it('defaults species to neonTetra when missing or unknown', () => {
    const att = [
      { name: 'Ali', entry_date: '2026-02-16', created_at: '2026-02-16T08:00:00Z' },
      { name: 'Cici', entry_date: '2026-02-16', created_at: '2026-02-16T08:00:00Z', species: '' },
      { name: 'Dedi', entry_date: '2026-02-16', created_at: '2026-02-16T08:00:00Z', species: 'zzz-unknown' },
    ];
    const board = computeLeaderboard(att, [], '2026-02-16', new Set());
    const byName = Object.fromEntries(board.map((r) => [r.name, r.species]));
    expect(byName['Ali']).toBe('neonTetra');
    expect(byName['Cici']).toBe('neonTetra');
    expect(byName['Dedi']).toBe('neonTetra');
  });

  it('maps Indonesian alias species via normalizeFishSpecies', () => {
    const att = [{ name: 'Eka', entry_date: '2026-02-16', created_at: '2026-02-16T08:00:00Z', species: 'hiu' }];
    const [row] = computeLeaderboard(att, [], '2026-02-16', new Set());
    expect(row.species).toBe('shark');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/streakCalculations.test.ts`
Expected: FAIL — `row.species` is undefined / property missing.

- [ ] **Step 3: Add the import and interface fields**

In `src/services/streakCalculations.ts`, at the very top add the import (keep any existing imports):

```ts
import { FishSpeciesType } from '../types';
import { normalizeFishSpecies } from './supabaseFishService';
```

Change `AttendanceRow`:

```ts
export interface AttendanceRow {
  name: string;
  entry_date: string; // YYYY-MM-DD
  created_at?: string; // ISO string, used for firstSeen tie-break
  species?: string | null; // raw species from communal_fishes
}
```

Add `species` to `LeaderboardEntry` (place it right after `firstSeen`):

```ts
export interface LeaderboardEntry {
  name: string;
  currentStreak: number;
  bestStreak: number;
  kuaciInStreak: number;
  firstSeen: string; // MIN(created_at) or '' when unknown
  species: FishSpeciesType; // from the latest-created_at attendance row
  rank: number;
}
```

- [ ] **Step 4: Track latest species per name and set it on the entry**

In `computeLeaderboard`, in the attendance grouping loop, add a map that records the species from the row with the greatest `created_at`. After the existing `firstSeenByName` declaration add:

```ts
  const latestSpeciesByName = new Map<string, { at: string; species: string }>();
```

Inside the attendance `for` loop, after the `firstSeenByName` block, add:

```ts
    // Track species from the row with the newest created_at (fallback: any row).
    const at = row.created_at || '';
    const prevSp = latestSpeciesByName.get(name);
    if (!prevSp || at >= prevSp.at) {
      latestSpeciesByName.set(name, { at, species: row.species || '' });
    }
```

Then in the entry-building loop, where the object is pushed, add the `species` field (right after `firstSeen: firstSeenByName.get(name) || '',`):

```ts
      species: normalizeFishSpecies(latestSpeciesByName.get(name)?.species),
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/services/streakCalculations.test.ts`
Expected: PASS (new species tests + existing ones).

- [ ] **Step 6: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/services/streakCalculations.ts src/services/streakCalculations.test.ts
git commit -m "feat(leaderboard): add species (latest attendance) to leaderboard entries"
```

---

## Task 2: Select species in the streak service query

**Files:**
- Modify: `src/services/streakService.ts`

**Interfaces:**
- Consumes: `AttendanceRow.species` (Task 1).

- [ ] **Step 1: Add species to the select**

In `src/services/streakService.ts`, find the attendance query inside `refresh()`:

```ts
      client.from('communal_fishes').select('name,entry_date,created_at'),
```

and change it to:

```ts
      client.from('communal_fishes').select('name,entry_date,created_at,species'),
```

- [ ] **Step 2: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/services/streakService.ts
git commit -m "feat(leaderboard): fetch species column for leaderboard icons"
```

---

## Task 3: FishSpeciesIcon component

**Files:**
- Create: `src/components/FishSpeciesIcon.tsx`

**Interfaces:**
- Consumes: `FishSpeciesType` from `../types`.
- Produces: `export const FishSpeciesIcon: React.FC<{ species: FishSpeciesType; size?: number; className?: string }>`.

- [ ] **Step 1: Create the component**

Create `src/components/FishSpeciesIcon.tsx`:

```tsx
import React from 'react';
import { FishSpeciesType } from '../types';

// Fill color per species, aligned with the canvas palette so the icon reads as
// the same fish that swims in the tank.
const SPECIES_COLOR: Record<FishSpeciesType, string> = {
  mascot: '#48b3bf',
  neonTetra: '#00f7ff',
  cherryShrimp: '#ef4444',
  angelfish: '#e2e8f0',
  rasbora: '#f97316',
  guppy: '#ec4899',
  shark: '#94a3b8',
  whale: '#60a5fa',
  dolphin: '#38bdf8',
  mantaRay: '#cbd5e1',
  pufferfish: '#f59e0b',
  orca: '#e2e8f0',
  turtle: '#22c55e',
};

// A simple, distinct silhouette per species drawn in a 24x24 viewBox. Bodies are
// an ellipse with a triangular tail; species differ by proportions and one accent
// so they are visually separable at small sizes.
function shapeFor(species: FishSpeciesType, color: string): React.ReactNode {
  const tail = (x: number, w: number, h: number) => (
    <path d={`M${x} 12 l-${w} -${h} l0 ${h * 2} z`} fill={color} />
  );
  switch (species) {
    case 'whale':
    case 'orca':
      return (
        <>
          <ellipse cx="13" cy="12" rx="9" ry="6" fill={color} />
          {tail(4, 4, 5)}
          <circle cx="17" cy="10" r="1.1" fill="#0a121d" />
        </>
      );
    case 'shark':
      return (
        <>
          <ellipse cx="13" cy="12" rx="9" ry="4.5" fill={color} />
          <path d="M12 8 l3 -5 l2 5 z" fill={color} />
          {tail(4, 4, 5)}
          <circle cx="18" cy="11" r="1" fill="#0a121d" />
        </>
      );
    case 'dolphin':
      return (
        <>
          <ellipse cx="13" cy="12" rx="9" ry="4" fill={color} />
          <path d="M11 9 l2 -3 l2 3 z" fill={color} />
          {tail(4, 4, 4)}
          <circle cx="18" cy="11" r="1" fill="#0a121d" />
        </>
      );
    case 'mantaRay':
      return (
        <>
          <path d="M4 12 q8 -7 16 0 q-8 5 -16 0 z" fill={color} />
          <circle cx="16" cy="11" r="1" fill="#0a121d" />
        </>
      );
    case 'pufferfish':
      return (
        <>
          <circle cx="12" cy="12" r="7" fill={color} />
          {tail(5, 3, 4)}
          <circle cx="15" cy="10" r="1.1" fill="#0a121d" />
        </>
      );
    case 'cherryShrimp':
      return (
        <>
          <path d="M6 14 q3 -8 12 -6 q-2 8 -12 6 z" fill={color} />
          <path d="M18 8 q3 -2 4 -4" stroke={color} strokeWidth="1" fill="none" />
          <circle cx="16" cy="9" r="0.9" fill="#0a121d" />
        </>
      );
    case 'angelfish':
      return (
        <>
          <path d="M12 4 q6 8 0 16 q-6 -8 0 -16 z" fill={color} />
          <circle cx="12" cy="9" r="1" fill="#0a121d" />
        </>
      );
    case 'guppy':
      return (
        <>
          <ellipse cx="12" cy="12" rx="6" ry="4" fill={color} />
          <path d="M6 12 l-4 -4 l1 4 l-1 4 z" fill={color} />
          <circle cx="15" cy="11" r="1" fill="#0a121d" />
        </>
      );
    case 'turtle':
      return (
        <>
          <ellipse cx="12" cy="12" rx="7" ry="5.5" fill={color} />
          <circle cx="20" cy="12" r="2" fill={color} />
          <path d="M9 8 l6 0 M9 16 l6 0" stroke="#0a121d" strokeWidth="0.8" />
        </>
      );
    case 'mascot':
      return (
        <>
          <path d="M18 12 l-6 -6 l-8 6 l8 6 z" fill={color} />
          {tail(4, 4, 5)}
          <circle cx="12" cy="10" r="1" fill="#ffffff" />
        </>
      );
    case 'rasbora':
    case 'neonTetra':
    default:
      return (
        <>
          <ellipse cx="13" cy="12" rx="8" ry="3.5" fill={color} />
          {tail(5, 4, 4)}
          <circle cx="18" cy="11" r="1" fill="#0a121d" />
        </>
      );
  }
}

export const FishSpeciesIcon: React.FC<{
  species: FishSpeciesType;
  size?: number;
  className?: string;
}> = ({ species, size = 22, className }) => {
  const color = SPECIES_COLOR[species] || SPECIES_COLOR.neonTetra;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {shapeFor(species, color)}
    </svg>
  );
};
```

- [ ] **Step 2: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/components/FishSpeciesIcon.tsx
git commit -m "feat(leaderboard): add per-species SVG icon component"
```

---

## Task 4: Highlight bridge on aquascapeEvents

**Files:**
- Modify: `src/components/aquascapeEvents.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Produces:
  - `FishParticle.hovered?: boolean`, `FishParticle.highlightUntil?: number` (types).
  - `AquascapeCanvasProvider.highlightFish?: (name: string, opts: { hover?: boolean; focus?: boolean }) => void`
  - `AquascapeCanvasProvider.clearFishHighlight?: (name?: string) => void`
  - `aquascapeEvents.highlightFish(name, opts)` and `aquascapeEvents.clearFishHighlight(name?)` (fan out to all providers).

- [ ] **Step 1: Add FishParticle fields**

In `src/types.ts`, in the `FishParticle` interface, after `communalId?: string | number;` add:

```ts
  hovered?: boolean;
  highlightUntil?: number;
```

- [ ] **Step 2: Extend the provider interface**

In `src/components/aquascapeEvents.ts`, add to `AquascapeCanvasProvider` (after `spawnFish?`):

```ts
  highlightFish?: (name: string, opts: { hover?: boolean; focus?: boolean }) => void;
  clearFishHighlight?: (name?: string) => void;
```

- [ ] **Step 3: Add manager fan-out methods**

In the `AquascapeEventManager` class, after the `spawnFish(...)` method, add:

```ts
  public highlightFish(name: string, opts: { hover?: boolean; focus?: boolean }): void {
    this.providers.forEach((p) => {
      if (p.provider.highlightFish) {
        try {
          p.provider.highlightFish(name, opts);
        } catch (err) {
          console.error('Error highlighting fish on provider:', err);
        }
      }
    });
  }

  public clearFishHighlight(name?: string): void {
    this.providers.forEach((p) => {
      if (p.provider.clearFishHighlight) {
        try {
          p.provider.clearFishHighlight(name);
        } catch (err) {
          console.error('Error clearing fish highlight on provider:', err);
        }
      }
    });
  }
```

- [ ] **Step 4: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/types.ts src/components/aquascapeEvents.ts
git commit -m "feat(canvas): add highlightFish/clearFishHighlight bridge and particle flags"
```

---

## Task 5: Canvas — implement highlight provider fns + render glow/marker

**Files:**
- Modify: `src/components/AquascapeCanvas.tsx`

**Interfaces:**
- Consumes: `normalizeName` from `../services/streakCalculations`; `FishParticle.hovered`/`highlightUntil` (Task 4); manager provider registration.

- [ ] **Step 1: Import normalizeName**

In `src/components/AquascapeCanvas.tsx`, update the streak-calculations import. Find:

```ts
import { isSupabaseModeActive } from '../services/supabaseFishService';
```

and add on the next line:

```ts
import { normalizeName } from '../services/streakCalculations';
```

- [ ] **Step 2: Add highlight callbacks**

Find the `spawnFish` useCallback (it ends with `[]);`). After it, add two new callbacks:

```ts
  const highlightFish = useCallback(
    (name: string, opts: { hover?: boolean; focus?: boolean }) => {
      const target = normalizeName(name);
      fishRef.current.forEach((f) => {
        if (normalizeName(f.name) === target) {
          if (opts.hover) f.hovered = true;
          if (opts.focus) f.highlightUntil = Date.now() + 4000;
        }
      });
    },
    []
  );

  const clearFishHighlight = useCallback((name?: string) => {
    const target = name ? normalizeName(name) : null;
    fishRef.current.forEach((f) => {
      if (target === null || normalizeName(f.name) === target) {
        f.hovered = false;
      }
    });
  }, []);
```

- [ ] **Step 3: Register the callbacks with the provider**

Find the `aquascapeEvents.registerProvider(canvasIdRef.current, { ... })` object. Add these two entries (after `spawnFish: (species, name) => spawnFish(species, name),`):

```ts
      highlightFish: (name, opts) => highlightFish(name, opts),
      clearFishHighlight: (name) => clearFishHighlight(name),
```

Then add `highlightFish, clearFishHighlight` to that effect's dependency array (it currently ends with `[dropFood, spawnBaby, syncCommunalFish, spawnFish]`). Make it:

```ts
  }, [dropFood, spawnBaby, syncCommunalFish, spawnFish, highlightFish, clearFishHighlight]);
```

- [ ] **Step 4: Draw the glow/marker in the render loop**

In the render loop, find the fish render block start:

```ts
        // ---------------------------------------------------------
        // RENDER FISH GRAPHICS
        // ---------------------------------------------------------
        ctx.save();
```

Insert BEFORE that `ctx.save();` (glow is drawn in world coordinates, behind the fish):

```ts
        // Highlight glow (hover) / spotlight (click, time-decayed) drawn behind fish.
        const isFocus = fish.highlightUntil !== undefined && fish.highlightUntil > currentTime;
        const isHighlight = fish.hovered === true || isFocus;
        if (isHighlight) {
          const glowR = Math.max(26, fish.size * 1.4);
          const g = ctx.createRadialGradient(fish.x, fish.y, 0, fish.x, fish.y, glowR);
          const strength = isFocus ? 0.55 : 0.32;
          g.addColorStop(0, `rgba(45, 212, 191, ${strength})`);
          g.addColorStop(1, 'rgba(45, 212, 191, 0)');
          ctx.save();
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(fish.x, fish.y, glowR, 0, Math.PI * 2);
          ctx.fill();
          if (isFocus) {
            // Pulsing ring marker around the focused fish.
            const pulse = glowR * (0.7 + Math.sin(timeSec * 6) * 0.12);
            ctx.strokeStyle = 'rgba(94, 234, 212, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(fish.x, fish.y, pulse, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }
```

- [ ] **Step 5: Force the nametag on when highlighted**

Find the nametag call:

```ts
        if (currentSettings.showNametags || isHovered) {
          const streakInfo = fish.isCommunal ? getStreakFor(fish.name) : undefined;
          drawFishNametag(ctx, fish, isHovered, streakInfo);
        }
```

and change the condition to include highlight (reuse the `isHighlight` computed above):

```ts
        if (currentSettings.showNametags || isHovered || isHighlight) {
          const streakInfo = fish.isCommunal ? getStreakFor(fish.name) : undefined;
          drawFishNametag(ctx, fish, isHovered || isHighlight, streakInfo);
        }
```

- [ ] **Step 6: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/components/AquascapeCanvas.tsx
git commit -m "feat(canvas): render glow on hover and pulsing spotlight on click highlight"
```

> NOTE: `currentTime` and `timeSec` already exist in the render loop scope (the
> animation frame time and `currentTime * 0.001`). Use them as-is; do not redeclare.

---

## Task 6: Drawer — icons + hover/click wiring

**Files:**
- Modify: `src/components/StreakLeaderboardDrawer.tsx`

**Interfaces:**
- Consumes: `FishSpeciesIcon` (Task 3); `aquascapeEvents.highlightFish`/`clearFishHighlight` (Task 4); `LeaderboardEntry.species` (Task 1).

- [ ] **Step 1: Add imports and selected-row state**

In `src/components/StreakLeaderboardDrawer.tsx`, update imports:

```ts
import { FishSpeciesIcon } from './FishSpeciesIcon';
```

(keep existing imports). Add state inside the component, after the `entries` state:

```ts
  const [selectedName, setSelectedName] = useState<string | null>(null);
```

- [ ] **Step 2: Clear highlights when the drawer closes/unmounts**

In the existing `useEffect` that subscribes to `onStreakUpdated`, change the cleanup to also clear highlights. Replace:

```ts
    return () => unsubscribe();
```

with:

```ts
    return () => {
      unsubscribe();
      aquascapeEvents.clearFishHighlight();
    };
```

- [ ] **Step 3: Make each row interactive with icon + handlers**

Replace the `<li>` block:

```tsx
                <li
                  key={e.name}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <span className="w-7 shrink-0 flex items-center justify-center font-mono text-sm text-slate-300">
                    {e.rank <= 3 ? <Crown className={`w-4 h-4 ${crownColor(e.rank)}`} /> : e.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{e.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Rekor terpanjang: {e.bestStreak} hari
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-teal-300">{e.currentStreak} hari</p>
                    <p className="text-[11px] text-slate-400 font-mono">{e.kuaciInStreak} kuaci</p>
                  </div>
                </li>
```

with:

```tsx
                <li key={e.name}>
                  <button
                    type="button"
                    onMouseEnter={() => aquascapeEvents.highlightFish(e.name, { hover: true })}
                    onMouseLeave={() => aquascapeEvents.clearFishHighlight(e.name)}
                    onClick={() => {
                      aquascapeEvents.highlightFish(e.name, { focus: true });
                      setSelectedName(e.name);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/60 border text-left transition-colors cursor-pointer hover:bg-slate-800/70 ${
                      selectedName === e.name
                        ? 'border-teal-400 ring-1 ring-teal-400/60'
                        : 'border-slate-800 hover:border-teal-500/40'
                    }`}
                    title="Sorot ikan ini di akuarium"
                  >
                    <span className="w-7 shrink-0 flex items-center justify-center font-mono text-sm text-slate-300">
                      {e.rank <= 3 ? <Crown className={`w-4 h-4 ${crownColor(e.rank)}`} /> : e.rank}
                    </span>
                    <FishSpeciesIcon species={e.species} size={24} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{e.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Rekor terpanjang: {e.bestStreak} hari
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-teal-300">{e.currentStreak} hari</p>
                      <p className="text-[11px] text-slate-400 font-mono">{e.kuaciInStreak} kuaci</p>
                    </div>
                  </button>
                </li>
```

- [ ] **Step 4: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/components/StreakLeaderboardDrawer.tsx
git commit -m "feat(leaderboard): show species icons and hover/click-to-highlight fish"
```

---

## Task 7: Manual verification

- [ ] **Step 1: Full suite**

Run: `npx tsc --noEmit` (clean) and `npx vitest run` (all pass).

- [ ] **Step 2: Live smoke test**

Start dev server, enter Zen (Supabase mode), open Ranking. Verify:
- Each row shows a species icon whose shape/color matches the fish type.
- Hovering a row makes the matching fish glow in the canvas; leaving stops it.
- Clicking a row gives a stronger glow + pulsing ring + visible nametag for ~4s, and highlights the row with a teal ring.
- Closing the drawer clears any hover glow.

---

## Self-Review Notes

- **Spec coverage:** species source latest-created_at (Task 1 ↔ §2/§3), service select (Task 2 ↔ §10), icon component (Task 3 ↔ §4), highlight bridge (Task 4 ↔ §5 + FishParticle flags §6), canvas render glow/marker + forced nametag (Task 5 ↔ §6), drawer icons + hover/click + clear-on-close (Task 6 ↔ §7). Manual verify (Task 7 ↔ §9).
- **Type consistency:** `highlightFish(name, {hover?,focus?})` and `clearFishHighlight(name?)` identical across events (T4), canvas (T5), drawer (T6). `LeaderboardEntry.species: FishSpeciesType` produced in T1, consumed by icon in T6. `FishParticle.hovered/highlightUntil` defined T4, used T5.
- **Render loop vars:** `currentTime` (frame time ms) and `timeSec` exist in scope; `highlightUntil` compared against `currentTime`; pulse uses `timeSec`. No redeclaration.
- **Name matching:** drawer passes raw `e.name` (already normalized by computeLeaderboard); canvas re-normalizes both sides via `normalizeName` so it matches particle names regardless of spacing.
