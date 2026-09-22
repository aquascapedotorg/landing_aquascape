import React, { useEffect, useState } from 'react';
import { AquascapeCanvas } from './AquascapeCanvas';
import { AquascapeControls } from './AquascapeControls';
import { FishCustomizerModal } from './FishCustomizerModal';
import { StreakLeaderboardDrawer } from './StreakLeaderboardDrawer';
import { AquascapeSettings } from '../types';
import { ZEN_CONFIG } from '../data/zenConfig';
import { isSupabaseModeActive } from '../services/supabaseFishService';
import { Minimize2, Info, Droplets, Thermometer, Activity, Sliders, RotateCw, Trophy } from 'lucide-react';

interface ZenProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AquascapeSettings;
  onUpdateSettings: (newSettings: Partial<AquascapeSettings>) => void;
  onFeedFish: () => void;
  onRegenerate?: (count?: number) => void;
}

export const ZenAquariumModal: React.FC<ZenProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onFeedFish,
  onRegenerate,
}) => {
  const [isFaunaModalOpen, setIsFaunaModalOpen] = useState(false);

  // In Supabase mode the fish roster is fully driven by the database, so manual
  // fauna customization (species/density/naming) does not apply — hide it.
  const supabaseMode = isSupabaseModeActive();
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isLeaderboardOpen) {
          setIsLeaderboardOpen(false);
        } else if (isFaunaModalOpen) {
          setIsFaunaModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isFaunaModalOpen, isLeaderboardOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white animate-fade-in overflow-hidden">
      {/* 1. Fullscreen Living Aquascape Simulation Canvas */}
      <div className="relative flex-1 w-full h-full">
        <AquascapeCanvas
          settings={settings}
          className="w-full h-full"
          isHeroOnly={false}
          onRegenerate={onRegenerate}
        />

        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-3 pointer-events-auto bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-teal-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide font-mono">
                AQUASCAPE Live Tank
              </h1>
              <p className="text-[10px] text-teal-300/80">Nature Aquarium • Zen Mode</p>
            </div>
          </div>

          {/* Biotope Telemetry HUD */}
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-teal-500/20 text-xs font-mono text-cyan-200/90 pointer-events-auto">
            <div className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-teal-400" />
              <span>{ZEN_CONFIG.telemetry.temperature}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>{ZEN_CONFIG.telemetry.ph}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{ZEN_CONFIG.telemetry.co2}</span>
            </div>
            {settings.enableLifeCycle !== false && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1 text-teal-300">
                  <RotateCw className="w-3.5 h-3.5 text-teal-400" />
                  <span>Regenerasi: {settings.totalRegenerations || 0}</span>
                </div>
              </>
            )}
          </div>

          {/* Top Actions: Fauna Settings & Close Zen */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Fauna customization is hidden in Supabase mode (roster is DB-driven) */}
            {!supabaseMode && (
              <button
                type="button"
                id="btn-zen-fauna-settings"
                onClick={() => setIsFaunaModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-teal-500/30 text-teal-300 font-semibold text-xs transition-all shadow-lg cursor-pointer active:scale-95 backdrop-blur-md"
                title="Atur Jenis Ikan, Kepadatan & Nama Ikan"
              >
                <Sliders className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">Fauna & Nama Ikan</span>
              </button>
            )}

            {supabaseMode && (
              <button
                type="button"
                id="btn-zen-leaderboard"
                onClick={() => setIsLeaderboardOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-teal-500/30 text-teal-300 font-semibold text-xs transition-all shadow-lg cursor-pointer active:scale-95 backdrop-blur-md"
                title="Lihat papan peringkat streak & kuaci"
              >
                <Trophy className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">Ranking</span>
              </button>
            )}

            {/* Close Zen Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/30 cursor-pointer active:scale-95"
              title="Tutup Mode Zen (ESC)"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Kembali ke Proyek</span>
            </button>
          </div>
        </div>

        {/* Floating Bottom Aquascape Controls */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-30 px-4">
          <div className="pointer-events-auto">
            <AquascapeControls
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onFeedFish={onFeedFish}
            />
          </div>
          <p className="text-xs text-white/70 font-mono flex items-center gap-1.5 drop-shadow bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
            <Info className="w-3.5 h-3.5 text-teal-400" />
            <span>Klik di mana saja pada aquarium untuk menyebarkan kuaci & menciptakan riak air alami</span>
          </p>
        </div>
      </div>

      {/* Fauna & Fish Customizer Modal (never shown in Supabase mode) */}
      <FishCustomizerModal
        isOpen={isFaunaModalOpen && !supabaseMode}
        onClose={() => setIsFaunaModalOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Streak Leaderboard Drawer (Supabase-only) */}
      {supabaseMode && (
        <StreakLeaderboardDrawer
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}
    </div>
  );
};

