import { describe, it, expect } from 'vitest';
import { computeLeaderboard, AttendanceRow, KuaciRow } from './streakCalculations';

const A = (name: string, d: string): AttendanceRow => ({ name, entry_date: d });
const K = (name: string, d: string, n: number): KuaciRow => ({ name, entry_date: d, kuaci_count: n });

describe('computeLeaderboard', () => {
  it('counts consecutive days ending today as current streak', () => {
    const att = [A('Budi', '2026-09-20'), A('Budi', '2026-09-21'), A('Budi', '2026-09-22')];
    const [row] = computeLeaderboard(att, [], '2026-09-22');
    expect(row.name).toBe('Budi');
    expect(row.currentStreak).toBe(3);
    expect(row.bestStreak).toBe(3);
  });

  it('resets current streak to 1 after a one-day gap', () => {
    // present 20,21,22, gap 23, present 24 -> today 24 -> current streak 1, best 3
    const att = [
      A('Budi', '2026-09-20'), A('Budi', '2026-09-21'), A('Budi', '2026-09-22'),
      A('Budi', '2026-09-24'),
    ];
    const [row] = computeLeaderboard(att, [], '2026-09-24');
    expect(row.currentStreak).toBe(1);
    expect(row.bestStreak).toBe(3);
  });

  it('keeps streak alive when today missing but yesterday present', () => {
    const att = [A('Budi', '2026-09-20'), A('Budi', '2026-09-21')];
    const [row] = computeLeaderboard(att, [], '2026-09-22'); // today 22, absent
    expect(row.currentStreak).toBe(2);
  });

  it('streak is 0 when neither today nor yesterday present', () => {
    const att = [A('Budi', '2026-09-19'), A('Budi', '2026-09-20')];
    const [row] = computeLeaderboard(att, [], '2026-09-22');
    expect(row.currentStreak).toBe(0);
  });

  it('sums kuaci only for dates inside the current streak', () => {
    const att = [A('Budi', '2026-09-21'), A('Budi', '2026-09-22')]; // streak = 21,22
    const kuaci = [
      K('Budi', '2026-09-20', 100), // outside streak -> ignored
      K('Budi', '2026-09-21', 5),
      K('Budi', '2026-09-22', 7),
    ];
    const [row] = computeLeaderboard(att, kuaci, '2026-09-22');
    expect(row.kuaciInStreak).toBe(12);
  });

  it('ranks by current streak desc, tie-break kuaci desc, and assigns 1-based rank', () => {
    const att = [
      A('Ali', '2026-09-22'), A('Ali', '2026-09-21'),   // streak 2
      A('Budi', '2026-09-22'), A('Budi', '2026-09-21'), // streak 2
      A('Cici', '2026-09-22'),                          // streak 1
    ];
    const kuaci = [K('Budi', '2026-09-22', 10), K('Ali', '2026-09-22', 3)];
    const board = computeLeaderboard(att, kuaci, '2026-09-22');
    expect(board.map((r) => r.name)).toEqual(['Budi', 'Ali', 'Cici']);
    expect(board.map((r) => r.rank)).toEqual([1, 2, 3]);
  });
});
