import { describe, it, expect } from 'vitest';
import {
  computeLeaderboard,
  isSkipDay,
  normalizeName,
  AttendanceRow,
  KuaciRow,
} from './streakCalculations';

const A = (name: string, d: string, created?: string): AttendanceRow => ({
  name,
  entry_date: d,
  created_at: created,
});
const K = (name: string, d: string, n: number): KuaciRow => ({ name, entry_date: d, kuaci_count: n });
const NO_HOLIDAYS = new Set<string>();

describe('isSkipDay', () => {
  it('treats Saturday and Sunday as skip days', () => {
    // 2026-02-14 is a Saturday, 2026-02-15 is a Sunday
    expect(isSkipDay('2026-02-14', NO_HOLIDAYS)).toBe(true);
    expect(isSkipDay('2026-02-15', NO_HOLIDAYS)).toBe(true);
    // 2026-02-13 is a Friday (working day)
    expect(isSkipDay('2026-02-13', NO_HOLIDAYS)).toBe(false);
  });

  it('treats listed holidays as skip days', () => {
    const holidays = new Set(['2026-05-01']); // a Friday holiday
    expect(isSkipDay('2026-05-01', holidays)).toBe(true);
    expect(isSkipDay('2026-05-01', NO_HOLIDAYS)).toBe(false);
  });
});

describe('computeLeaderboard with weekend/holiday skip', () => {
  it('bridges a weekend: Friday then Monday = streak 2', () => {
    // 2026-02-13 Fri, 2026-02-16 Mon (14/15 are Sat/Sun)
    const att = [A('Budi', '2026-02-13'), A('Budi', '2026-02-16')];
    const [row] = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS);
    expect(row.currentStreak).toBe(2);
  });

  it('bridges a holiday in the middle without breaking', () => {
    // 2026-04-30 Thu, 2026-05-01 Fri (holiday), 2026-05-04 Mon (2/3 May = Sat/Sun)
    const holidays = new Set(['2026-05-01']);
    const att = [A('Budi', '2026-04-30'), A('Budi', '2026-05-04')];
    const [row] = computeLeaderboard(att, [], '2026-05-04', holidays);
    expect(row.currentStreak).toBe(2); // Thu + Mon, Fri holiday + weekend bridged
  });

  it('breaks the streak when a working day is missed', () => {
    // 2026-02-16 Mon present, 2026-02-17 Tue MISSING (working day), 2026-02-18 Wed present
    const att = [A('Budi', '2026-02-16'), A('Budi', '2026-02-18')];
    const [row] = computeLeaderboard(att, [], '2026-02-18', NO_HOLIDAYS);
    expect(row.currentStreak).toBe(1); // Tue missed -> reset
  });

  it('keeps streak alive when today is a weekend and last Friday was present', () => {
    // today 2026-02-14 (Sat), last present 2026-02-13 (Fri)
    const att = [A('Budi', '2026-02-12'), A('Budi', '2026-02-13')];
    const [row] = computeLeaderboard(att, [], '2026-02-14', NO_HOLIDAYS);
    expect(row.currentStreak).toBe(2); // Thu + Fri, today Sat skipped
  });

  it('sums kuaci only for attended working days in the streak', () => {
    const att = [A('Budi', '2026-02-13'), A('Budi', '2026-02-16')];
    const kuaci = [K('Budi', '2026-02-13', 4), K('Budi', '2026-02-16', 6), K('Budi', '2026-02-10', 99)];
    const [row] = computeLeaderboard(att, kuaci, '2026-02-16', NO_HOLIDAYS);
    expect(row.kuaciInStreak).toBe(10);
  });
});

describe('computeLeaderboard tie-break by firstSeen', () => {
  it('ranks equal streaks by earliest created_at, then name', () => {
    const att = [
      A('Budi', '2026-02-16', '2026-02-16T09:00:00Z'),
      A('Ali', '2026-02-16', '2026-02-16T08:00:00Z'), // joined earlier
      A('Cici', '2026-02-16'), // no created_at
    ];
    const board = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS);
    // Ali (earliest) first, then Budi, then Cici (no created_at sorts last)
    expect(board.map((r) => r.name)).toEqual(['Ali', 'Budi', 'Cici']);
    expect(board.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('is stable: same input yields the same order twice', () => {
    const att = [
      A('Budi', '2026-02-16', '2026-02-16T09:00:00Z'),
      A('Ali', '2026-02-16', '2026-02-16T08:00:00Z'),
    ];
    const first = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS).map((r) => r.name);
    const second = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS).map((r) => r.name);
    expect(first).toEqual(second);
  });

  it('exposes firstSeen on each entry', () => {
    const att = [A('Ali', '2026-02-16', '2026-02-16T08:00:00Z')];
    const [row] = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS);
    expect(row.firstSeen).toBe('2026-02-16T08:00:00Z');
  });
});

describe('normalizeName', () => {
  it('trims ends and squashes internal whitespace, preserving case', () => {
    expect(normalizeName('Piki Rahmadi ')).toBe('Piki Rahmadi');
    expect(normalizeName('  Piki Rahmadi')).toBe('Piki Rahmadi');
    expect(normalizeName('Piki  Rahmadi')).toBe('Piki Rahmadi');
    expect(normalizeName('piki rahmadi')).toBe('piki rahmadi'); // case preserved
  });
});

describe('computeLeaderboard whitespace-variant merging', () => {
  it('merges attendance from whitespace-variant names into one participant', () => {
    // Same person wrote a trailing space on the 2nd day (02-13 Fri, 02-16 Mon bridge weekend)
    const att = [A('Piki Rahmadi', '2026-02-13'), A('Piki Rahmadi ', '2026-02-16')];
    const board = computeLeaderboard(att, [], '2026-02-16', NO_HOLIDAYS);
    expect(board).toHaveLength(1); // one entry, not two
    expect(board[0].name).toBe('Piki Rahmadi'); // normalized display
    expect(board[0].currentStreak).toBe(2); // streak joined across variants
  });

  it('sums kuaci across whitespace-variant names for the same date', () => {
    const att = [A('Budi', '2026-02-16'), A('Budi ', '2026-02-16')];
    const kuaci = [K('Budi', '2026-02-16', 3), K('Budi ', '2026-02-16', 4)];
    const [row] = computeLeaderboard(att, kuaci, '2026-02-16', NO_HOLIDAYS);
    expect(row.kuaciInStreak).toBe(7);
  });
});

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
