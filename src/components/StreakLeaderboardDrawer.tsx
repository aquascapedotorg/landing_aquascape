import React, { useEffect, useState } from 'react';
import { X, Trophy, Crown } from 'lucide-react';
import { getLeaderboard } from '../services/streakService';
import { LeaderboardEntry } from '../services/streakCalculations';
import { aquascapeEvents } from './aquascapeEvents';
import { FishSpeciesIcon } from './FishSpeciesIcon';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StreakLeaderboardDrawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEntries([...getLeaderboard()]);
    const unsubscribe = aquascapeEvents.onStreakUpdated(() => {
      setEntries([...getLeaderboard()]);
    });
    return () => {
      unsubscribe();
      aquascapeEvents.clearFishHighlight();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const crownColor = (rank: number) =>
    rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : 'text-orange-400';

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Streak Leaderboard"
        className="relative w-full max-w-sm h-full bg-[#0a121d] border-l border-teal-500/25 shadow-2xl flex flex-col animate-fade-in"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-teal-300">
            <Trophy className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm font-bold tracking-wide">Streak Leaderboard</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {entries.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-16 px-6">
              No entries yet.
            </div>
          ) : (
            <ol className="space-y-1.5">
              {entries.map((e) => (
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
                        Best Record: {e.bestStreak} days
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-teal-300">{e.currentStreak} days</p>
                      <p className="text-[11px] text-slate-400 font-mono">{e.kuaciInStreak} kuaci</p>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
};
