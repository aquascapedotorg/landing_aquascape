# Legendary Gold Fish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each day one participant is deterministically chosen as the Legendary fish, rendered as a shimmering gold koi with glow/sparkle/trail effects and announced by a Zen banner.

**Architecture:** A pure `pickLegendaryName(names, dateStr)` picks the daily winner (date-seeded, sorted-name index) so all clients agree. A `legendaryService` computes/stores the winner and recomputes on roster changes. The canvas tags the matching communal particle `isLegendary`, renders it as a gold koi (canvas paths) with a pulsing gold glow, sparkles, and a fading trail, and draws a gold nametag. A Zen banner announces the winner. Supabase-mode only.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest, HTML Canvas 2D.

**Spec:** `docs/superpowers/specs/2026-09-24-legendary-fish-design.md`

## Global Constraints

- Feature active only when `isSupabaseModeActive()` is true.
- No emojis. Star/crown icons are canvas paths (canvas) or lucide SVG (React banner).
- Winner selection is deterministic per (sorted names, date): all clients see the same fish.
- Name matching uses `normalizeName` (exported from `streakCalculations.ts`).
- Banner copy: main text `"{Name} — Shining Gold, Chosen Today"`, sub-text `"Aquascape Legend"`.
- Gold palette: highlight `#fff3b0`, body `#f5c542`, shadow `#b8860b`, accent `#ffd700`.
- Legendary UI (banner, gold nametag) hides in clean mode like other Zen UI; the koi + canvas glow stay (they are part of the canvas).
- Run tests with `npx vitest run`; typecheck with `npx tsc --noEmit`. Both pass before each commit.

---

## File Structure

- **Modify:** `src/services/streakCalculations.ts` — add pure `pickLegendaryName`.
- **Modify:** `src/services/streakCalculations.test.ts` — tests for it.
- **Create:** `src/services/legendaryService.ts` — compute/store winner, subscribe, getter.
- **Modify:** `src/types.ts` — `FishParticle.isLegendary?: boolean`.
- **Modify:** `src/data/fishCatalog.ts` — init legendaryService in the Supabase branch.
- **Modify:** `src/components/AquascapeCanvas.tsx` — tag isLegendary; render gold koi + glow/sparkle/trail.
- **Modify:** `src/components/fishRenderer.ts` — gold legendary nametag branch.
- **Modify:** `src/components/ZenAquariumModal.tsx` — legendary banner (Supabase-only, hidden in clean mode).

---

## Task 1: Deterministic winner picker (pure)

**Files:**
- Modify: `src/services/streakCalculations.ts`
- Modify: `src/services/streakCalculations.test.ts`

**Interfaces:**
- Produces: `export function pickLegendaryName(names: string[], dateStr: string): string | null`

- [ ] **Step 1: Write the failing tests**

Append to `src/services/streakCalculations.test.ts`:

```ts
import { pickLegendaryName } from './streakCalculations';

describe('pickLegendaryName', () => {
  const names = ['Budi', 'Ali', 'Cici', 'Dedi', 'Eka'];

  it('is deterministic for the same names and date', () => {
    const a = pickLegendaryName(names, '2026-09-24');
    const b = pickLegendaryName(names, '2026-09-24');
    expect(a).toBe(b);
    expect(names).toContain(a);
  });

  it('is independent of input order (sorts internally)', () => {
    const a = pickLegendaryName(['Ali', 'Budi', 'Cici', 'Dedi', 'Eka'], '2026-09-24');
    const b = pickLegendaryName(['Eka', 'Dedi', 'Cici', 'Budi', 'Ali'], '2026-09-24');
    expect(a).toBe(b);
  });

  it('returns null for an empty list', () => {
    expect(pickLegendaryName([], '2026-09-24')).toBeNull();
  });

  it('always returns a member of the list', () => {
    for (const date of ['2026-01-01', '2026-06-15', '2026-12-31', '2027-03-08']) {
      expect(names).toContain(pickLegendaryName(names, date));
    }
  });

  it('varies across at least some dates', () => {
    const picks = new Set(
      ['2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'].map((d) =>
        pickLegendaryName(names, d)
      )
    );
    expect(picks.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/streakCalculations.test.ts`
Expected: FAIL — `pickLegendaryName` is not exported.

- [ ] **Step 3: Implement**

Add to the END of `src/services/streakCalculations.ts`:

```ts
/**
 * Deterministically picks one name as the daily "legendary" winner. The choice
 * depends only on the (order-independent) set of names and the date string, so
 * every client computes the same winner for a given day. Returns null when the
 * list is empty.
 */
export function pickLegendaryName(names: string[], dateStr: string): string | null {
  const cleaned = [...new Set(names.map((n) => normalizeName(n)).filter((n) => n))].sort();
  if (cleaned.length === 0) return null;
  // djb2 hash of the date string -> stable non-negative index.
  let hash = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash + dateStr.charCodeAt(i)) >>> 0;
  }
  return cleaned[hash % cleaned.length];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/streakCalculations.test.ts`
Expected: PASS (all new + existing).

- [ ] **Step 5: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/services/streakCalculations.ts src/services/streakCalculations.test.ts
git commit -m "feat(legendary): add deterministic daily winner picker"
```

---

## Task 2: legendaryService

**Files:**
- Create: `src/services/legendaryService.ts`
- Test: `src/services/legendaryService.test.ts`

**Interfaces:**
- Consumes: `pickLegendaryName`, `toDateString` (Task 1 / existing) from `./streakCalculations`; `getLeaderboard` from `./streakService`; `isSupabaseModeActive` from `./supabaseFishService`; `aquascapeEvents` from `../components/aquascapeEvents`.
- Produces:
  - `function initLegendaryService(): void`
  - `function getLegendaryName(): string | null`
  - `function recomputeLegendary(): void`
  - `function __setLegendaryForTest(name: string | null): void`
  - `function __resetLegendaryForTest(): void`

- [ ] **Step 1: Write the failing test**

Create `src/services/legendaryService.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLegendaryName,
  __setLegendaryForTest,
  __resetLegendaryForTest,
} from './legendaryService';

describe('legendaryService', () => {
  beforeEach(() => __resetLegendaryForTest());

  it('has no legendary name before anything is computed', () => {
    expect(getLegendaryName()).toBeNull();
  });

  it('exposes the set legendary name (test hook)', () => {
    __setLegendaryForTest('Budi');
    expect(getLegendaryName()).toBe('Budi');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/legendaryService.test.ts`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Implement**

Create `src/services/legendaryService.ts`:

```ts
import { pickLegendaryName, toDateString } from './streakCalculations';
import { getLeaderboard } from './streakService';
import { isSupabaseModeActive } from './supabaseFishService';
import { aquascapeEvents } from '../components/aquascapeEvents';

let legendaryName: string | null = null;
let initialised = false;

/** Recompute today's winner from the current leaderboard participants. */
export function recomputeLegendary(): void {
  if (!isSupabaseModeActive()) {
    legendaryName = null;
    return;
  }
  const names = getLeaderboard().map((e) => e.name);
  legendaryName = pickLegendaryName(names, toDateString(new Date()));
}

/** The current legendary participant name, or null. */
export function getLegendaryName(): string | null {
  return legendaryName;
}

/** Start tracking the daily legendary winner (Supabase-only). Idempotent. */
export function initLegendaryService(): void {
  if (initialised) return;
  if (!isSupabaseModeActive()) return;
  initialised = true;
  recomputeLegendary();
  // The leaderboard updates on roster/streak changes; recompute alongside it.
  aquascapeEvents.onStreakUpdated(() => recomputeLegendary());
}

// --- Test-only helpers ---
export function __setLegendaryForTest(name: string | null): void {
  legendaryName = name;
}
export function __resetLegendaryForTest(): void {
  legendaryName = null;
  initialised = false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/legendaryService.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/services/legendaryService.ts src/services/legendaryService.test.ts
git commit -m "feat(legendary): add legendaryService to track the daily winner"
```

---

## Task 3: FishParticle flag + service init wiring

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/fishCatalog.ts`

**Interfaces:**
- Consumes: `initLegendaryService` (Task 2).
- Produces: `FishParticle.isLegendary?: boolean`.

- [ ] **Step 1: Add the particle flag**

In `src/types.ts`, in the `FishParticle` interface, after `highlightUntil?: number;` add:

```ts
  isLegendary?: boolean;
```

- [ ] **Step 2: Init the service on Supabase load**

In `src/data/fishCatalog.ts`, find the existing `initStreakService();` call (in the Supabase branch of `loadFishNamesCatalog`, right after `setSupabaseModeActive(true);`). Immediately after that line add:

```ts
    initLegendaryService();
```

Add the import near the other service imports at the top of `fishCatalog.ts`:

```ts
import { initLegendaryService } from '../services/legendaryService';
```

- [ ] **Step 3: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/types.ts src/data/fishCatalog.ts
git commit -m "feat(legendary): add isLegendary flag and init the service on Supabase load"
```

---

## Task 4: Tag the legendary particle in the canvas

**Files:**
- Modify: `src/components/AquascapeCanvas.tsx`

**Interfaces:**
- Consumes: `getLegendaryName` (Task 2); `normalizeName` (already imported).
- Produces: a `tagLegendary(list)` helper applied wherever the roster changes.

- [ ] **Step 1: Import getLegendaryName**

In `src/components/AquascapeCanvas.tsx`, add after the streak-calculations import:

```ts
import { getLegendaryName } from '../services/legendaryService';
```

- [ ] **Step 2: Add a tagging helper**

Inside the `AquascapeCanvas` component, near the other `useCallback`s (e.g. right before `const canvasIdRef`), add:

```ts
  const tagLegendary = useCallback((list: FishParticle[]) => {
    const legendary = getLegendaryName();
    const target = legendary ? normalizeName(legendary) : null;
    list.forEach((f) => {
      f.isLegendary = target !== null && f.isCommunal === true && normalizeName(f.name) === target;
    });
  }, []);
```

- [ ] **Step 3: Apply tagging after roster updates**

Call `tagLegendary(fishRef.current)` immediately before each `aquascapeEvents.notifyFishRosterChanged();` inside the component's own methods (`syncCommunalFish`, `spawnFish`, and the density-sync effect) AND at the end of `initAquascape` right after `fishRef.current` is finalized. Also re-tag on streak updates so a winner change re-marks fish: in the existing `onCatalogLoaded` effect area, add a subscription.

Concretely, add this effect after the `onCatalogLoaded` effect:

```ts
  // Re-tag the legendary fish whenever the winner may have changed.
  useEffect(() => {
    const unsub = aquascapeEvents.onStreakUpdated(() => {
      tagLegendary(fishRef.current);
      aquascapeEvents.notifyFishRosterChanged();
    });
    return () => unsub();
  }, [tagLegendary]);
```

And in `syncCommunalFish` (after `fishRef.current = applyCommunalFishesToSchool(...)`), `spawnFish` (after pushing the new fish), and the density effect (after `syncFishSchool(...)`), insert `tagLegendary(fishRef.current);` on the line before their `aquascapeEvents.notifyFishRosterChanged();`. In `initAquascape`, add `tagLegendary(fishRef.current);` right before `setFishCount(...)` in both branches.

- [ ] **Step 4: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/components/AquascapeCanvas.tsx
git commit -m "feat(legendary): tag the winning communal fish as legendary"
```

---

## Task 5: Render the gold koi + glow/sparkle/trail

**Files:**
- Modify: `src/components/AquascapeCanvas.tsx`

**Interfaces:**
- Consumes: `fish.isLegendary` (Task 3), tagging (Task 4).

- [ ] **Step 1: Add a trail store**

Near the other refs at the top of the component (e.g. after `const foodRef = ...`), add:

```ts
  const legendaryTrailRef = useRef<Map<number, { x: number; y: number }[]>>(new Map());
```

- [ ] **Step 2: Draw the aura + trail BEFORE the fish transform**

In the render loop, find the existing highlight-glow block that starts with:

```ts
        // Highlight glow (hover) / spotlight (click, time-decayed) drawn behind fish.
        const isFocus = fish.highlightUntil !== undefined && fish.highlightUntil > Date.now();
```

Immediately BEFORE that line, insert the legendary aura + trail (world coordinates):

```ts
        // Legendary gold aura, sparkles, and a fading trail (behind the fish).
        if (fish.isLegendary) {
          // Trail: remember recent positions and draw fading gold dots.
          let trail = legendaryTrailRef.current.get(fish.id);
          if (!trail) { trail = []; legendaryTrailRef.current.set(fish.id, trail); }
          trail.push({ x: fish.x, y: fish.y });
          if (trail.length > 14) trail.shift();
          for (let ti = 0; ti < trail.length; ti++) {
            const p = trail[ti];
            const a = (ti / trail.length) * 0.4;
            ctx.fillStyle = `rgba(255, 215, 0, ${a})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 + (ti / trail.length) * 3, 0, Math.PI * 2);
            ctx.fill();
          }
          // Pulsing gold glow.
          const glowR = Math.max(34, fish.size * 1.9) * (0.9 + Math.sin(timeSec * 3) * 0.1);
          const gg = ctx.createRadialGradient(fish.x, fish.y, 0, fish.x, fish.y, glowR);
          gg.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
          gg.addColorStop(0.5, 'rgba(245, 197, 66, 0.22)');
          gg.addColorStop(1, 'rgba(245, 197, 66, 0)');
          ctx.save();
          ctx.fillStyle = gg;
          ctx.beginPath();
          ctx.arc(fish.x, fish.y, glowR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          // Sparkles: a few twinkling star dots around the fish.
          for (let k = 0; k < 5; k++) {
            const ang = (k / 5) * Math.PI * 2 + timeSec * 0.8;
            const rad = fish.size * (1.1 + 0.25 * Math.sin(timeSec * 2 + k));
            const tw = 0.5 + 0.5 * Math.sin(timeSec * 5 + k * 1.7);
            const sx = fish.x + Math.cos(ang) * rad;
            const sy = fish.y + Math.sin(ang) * rad;
            ctx.fillStyle = `rgba(255, 243, 176, ${tw})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.6 * tw + 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (legendaryTrailRef.current.has(fish.id)) {
          legendaryTrailRef.current.delete(fish.id); // stopped being legendary
        }

```

- [ ] **Step 3: Render the gold koi body (overrides the species render)**

Find the species render chain that begins with `if (fish.type === 'mascot') {`. Change that opening line to first handle legendary:

Replace:

```ts
        if (fish.type === 'mascot') {
```

with:

```ts
        if (fish.isLegendary) {
          // --- LEGENDARY GOLD KOI (overrides the participant's normal species) ---
          const L = fish.size * 1.15;
          const H = L * 0.42;
          // Flowing caudal tail.
          ctx.save();
          ctx.translate(-L * 0.42, 0);
          ctx.rotate(tailWag * 1.2);
          ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-L * 0.35, -H * 0.9, -L * 0.55, -H * 0.5);
          ctx.quadraticCurveTo(-L * 0.4, 0, -L * 0.55, H * 0.5);
          ctx.quadraticCurveTo(-L * 0.35, H * 0.9, 0, 0);
          ctx.fill();
          ctx.restore();
          // Body gradient (gold).
          const bg = ctx.createLinearGradient(0, -H, 0, H);
          bg.addColorStop(0, '#fff3b0');
          bg.addColorStop(0.5, '#f5c542');
          bg.addColorStop(1, '#b8860b');
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.ellipse(0, 0, L * 0.5, H, 0, 0, Math.PI * 2);
          ctx.fill();
          // Dorsal + pelvic fins.
          ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
          ctx.beginPath();
          ctx.moveTo(L * 0.05, -H);
          ctx.quadraticCurveTo(-L * 0.1, -H * 1.8, -L * 0.25, -H * 0.9);
          ctx.lineTo(-L * 0.1, -H * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(L * 0.05, H);
          ctx.quadraticCurveTo(-L * 0.1, H * 1.8, -L * 0.25, H * 0.9);
          ctx.lineTo(-L * 0.1, H * 0.7);
          ctx.closePath();
          ctx.fill();
          // Soft koi blotches (white/orange accents).
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.beginPath();
          ctx.ellipse(L * 0.1, -H * 0.2, L * 0.12, H * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 140, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(-L * 0.12, H * 0.15, L * 0.1, H * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
          // Eye.
          ctx.fillStyle = '#3a2a00';
          ctx.beginPath();
          ctx.arc(L * 0.32, -H * 0.15, Math.max(1.5, L * 0.045), 0, Math.PI * 2);
          ctx.fill();
        } else if (fish.type === 'mascot') {
```

- [ ] **Step 4: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/components/AquascapeCanvas.tsx
git commit -m "feat(legendary): render the winner as a shimmering gold koi with aura, sparkles, and trail"
```

---

## Task 6: Gold legendary nametag

**Files:**
- Modify: `src/components/fishRenderer.ts`
- Modify: `src/components/AquascapeCanvas.tsx`

**Interfaces:**
- Consumes: `fish.isLegendary`.
- Produces: legendary styling in `drawFishNametag`.

- [ ] **Step 1: Style the nametag gold for legendary fish**

In `src/components/fishRenderer.ts`, inside `drawFishNametag`, find the frosted pill background block:

```ts
  // Frosted dark pill background
  ctx.fillStyle = isHovered ? 'rgba(9, 19, 29, 0.94)' : 'rgba(9, 19, 29, 0.68)';
  ctx.strokeStyle = isHovered ? 'rgba(45, 212, 191, 0.9)' : 'rgba(45, 212, 191, 0.35)';
```

Replace those two lines with legendary-aware styling:

```ts
  // Frosted dark pill background (gold when legendary).
  ctx.fillStyle = fish.isLegendary
    ? 'rgba(40, 30, 0, 0.9)'
    : isHovered ? 'rgba(9, 19, 29, 0.94)' : 'rgba(9, 19, 29, 0.68)';
  ctx.strokeStyle = fish.isLegendary
    ? 'rgba(255, 215, 0, 0.95)'
    : isHovered ? 'rgba(45, 212, 191, 0.9)' : 'rgba(45, 212, 191, 0.35)';
```

Then find the fish-name text fill:

```ts
  // Fish Name Text
  ctx.fillStyle = isHovered ? '#ffffff' : '#e2e8f0';
```

Replace with:

```ts
  // Fish Name Text (gold when legendary).
  ctx.fillStyle = fish.isLegendary ? '#ffe680' : isHovered ? '#ffffff' : '#e2e8f0';
```

- [ ] **Step 2: Force the legendary nametag to always show**

In `src/components/AquascapeCanvas.tsx`, find the nametag condition:

```ts
        if (currentSettings.showNametags || isHovered || isHighlight) {
          const streakInfo = fish.isCommunal ? getStreakFor(fish.name) : undefined;
          drawFishNametag(ctx, fish, isHovered || isHighlight, streakInfo);
        }
```

Replace with (legendary always shows its nametag):

```ts
        if (currentSettings.showNametags || isHovered || isHighlight || fish.isLegendary) {
          const streakInfo = fish.isCommunal ? getStreakFor(fish.name) : undefined;
          drawFishNametag(ctx, fish, isHovered || isHighlight, streakInfo);
        }
```

- [ ] **Step 3: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/components/fishRenderer.ts src/components/AquascapeCanvas.tsx
git commit -m "feat(legendary): gold nametag for the legendary fish, always visible"
```

---

## Task 7: Zen legendary banner

**Files:**
- Modify: `src/components/ZenAquariumModal.tsx`

**Interfaces:**
- Consumes: `getLegendaryName` (Task 2); `aquascapeEvents.onStreakUpdated`.

- [ ] **Step 1: Import and add reactive state**

In `src/components/ZenAquariumModal.tsx`, add imports:

```ts
import { getLegendaryName } from '../services/legendaryService';
import { Sparkles } from 'lucide-react';
```

(Combine the `lucide-react` import with the existing one rather than duplicating it — add `Sparkles` to the existing list.)

After the `fishCount` state/effect, add:

```ts
  const [legendaryName, setLegendaryName] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const update = () => setLegendaryName(getLegendaryName());
    update();
    const settle = setTimeout(update, 400);
    const unsub = aquascapeEvents.onStreakUpdated(update);
    return () => {
      clearTimeout(settle);
      unsub();
    };
  }, [isOpen]);
```

- [ ] **Step 2: Render the banner**

Just after the closing `)}` of the "Top Header Bar" block (i.e. after the `{!cleanMode && ( ... )}` that wraps the header, before the bottom-controls block), add:

```tsx
        {/* Legendary announcement banner (Supabase-only, hidden in clean mode) */}
        {!cleanMode && supabaseMode && legendaryName && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-950/80 via-yellow-900/70 to-amber-950/80 backdrop-blur-md shadow-[0_0_20px_rgba(255,215,0,0.35)]">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <div className="leading-tight">
                <p className="text-sm font-bold text-amber-200 tracking-wide">
                  {legendaryName} — Shining Gold, Chosen Today
                </p>
                <p className="text-[10px] text-amber-300/80 font-mono">Aquascape Legend</p>
              </div>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
          </div>
        )}
```

- [ ] **Step 3: Typecheck, test, commit**

```bash
npx tsc --noEmit
npx vitest run
git add src/components/ZenAquariumModal.tsx
git commit -m "feat(legendary): announce the daily legend with a gold Zen banner"
```

---

## Task 8: Manual verification

- [ ] **Step 1: Full suite**

Run `npx tsc --noEmit` (clean) and `npx vitest run` (all pass).

- [ ] **Step 2: Live smoke test**

Start dev (Supabase mode), enter Zen. Verify:
- Exactly one communal fish is a gold koi with pulsing glow, sparkles, and a fading trail.
- Its nametag is gold and always visible.
- The Zen banner reads "{Name} — Shining Gold, Chosen Today" / "Aquascape Legend".
- Toggling clean mode hides the banner and gold nametag; the koi + glow remain.
- All visitors would see the same winner (deterministic) — confirm the name matches
  `pickLegendaryName(sortedNames, today)`.

---

## Self-Review Notes

- **Spec coverage:** picker (T1 ↔ §2), service (T2 ↔ §3), flag+init (T3 ↔ §3/§8), tagging (T4 ↔ §3), koi + glow/sparkle/trail (T5 ↔ §4/§5), gold nametag (T6 ↔ §6), Zen banner (T7 ↔ §7), verify (T8 ↔ §11). All covered.
- **Type consistency:** `pickLegendaryName(names, dateStr): string|null`, `getLegendaryName(): string|null`, `FishParticle.isLegendary?: boolean`, `tagLegendary(list)` used consistently across tasks. Banner copy matches spec verbatim.
- **Ordering:** aura/trail drawn before the fish transform (world coords); koi render is the first branch of the species chain so it overrides type; nametag condition includes `isLegendary`.
- **Clean mode:** banner + nametag gated; koi/glow stay on canvas (per spec §10).
