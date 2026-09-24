import React, { useEffect, useState } from 'react';
import { AquascapeCanvas } from './AquascapeCanvas';
import { AquascapeControls } from './AquascapeControls';
import { FishCustomizerModal } from './FishCustomizerModal';
import { StreakLeaderboardDrawer } from './StreakLeaderboardDrawer';
import { AquascapeSettings } from '../types';
import { isSupabaseModeActive } from '../services/supabaseFishService';
import { subscribeToViewerCount } from '../services/presenceService';
import { resolveLighting } from '../data/lightingUtils';
import { getTodayLegendaryList } from '../services/legendaryService';
import { shouldTeaseLegend } from '../services/legendaryPresence';
import { LegendaryKoiSilhouette } from './LegendaryKoiSilhouette';
import { aquascapeEvents } from './aquascapeEvents';
import { Minimize2, Info, Droplets, Thermometer, Activity, Sliders, RotateCw, Trophy, Eye, EyeOff, Fish, Sparkles } from 'lucide-react';

interface Telemetry {
  temperature: string;
  ph: string;
  co2: string;
}

/**
 * Derives live-looking biotope readings from the current settings:
 * - temperature tracks lighting (daylight warmest, moonlight coolest)
 * - CO2 is high when the diffuser is on, low when off
 * - pH drops as dissolved CO2 rises (carbonic acid), so it's lower when CO2 is on
 * Each reading gets a small random fluctuation so the HUD reads like a sensor.
 */
function computeTelemetry(settings: AquascapeSettings): Telemetry {
  const jitter = (spread: number) => (Math.random() - 0.5) * 2 * spread;

  const lighting = resolveLighting(settings.lighting);
  const baseTemp = lighting === 'daylight' ? 25.2 : lighting === 'moonlight' ? 24.2 : 24.8;
  const temp = baseTemp + jitter(0.3);

  const baseCo2 = settings.co2Active ? 28 : 12;
  const co2 = Math.max(0, Math.round(baseCo2 + jitter(3)));

  const basePh = settings.co2Active ? 6.5 : 6.9;
  const ph = basePh + jitter(0.1);

  return {
    temperature: `${temp.toFixed(1)}°C`,
    ph: `pH ${ph.toFixed(1)}`,
    co2: `CO2 ~${co2}ppm`,
  };
}

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

  // Live count of fish currently in the tank, updated whenever the roster changes.
  const [fishCount, setFishCount] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const update = () => setFishCount(aquascapeEvents.getFishList().length);
    update();
    // Poll briefly after open so the count reflects the freshly-mounted Zen canvas,
    // then rely on roster-change events for updates (spawn / sync / density).
    const settle = setTimeout(update, 400);
    const unsubscribe = aquascapeEvents.onFishRosterChanged(update);
    return () => {
      clearTimeout(settle);
      unsubscribe();
    };
  }, [isOpen]);

  // Live count of people currently viewing the site (shared Supabase Presence
  // channel — same number shown on the main landing header, no double-counting).
  const [viewerCount, setViewerCount] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeToViewerCount(setViewerCount);
    return unsubscribe;
  }, [isOpen]);

  const [legendaryName, setLegendaryName] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const list = getTodayLegendaryList();
      setLegendaryName(list.length > 0 ? list[list.length - 1].name : null);
    };
    update();
    const settle = setTimeout(update, 400);
    const unsub = aquascapeEvents.onLegendaryUpdated(update);
    return () => {
      clearTimeout(settle);
      unsub();
    };
  }, [isOpen]);

  // No legend has been born yet TODAY. While that's true we show a dimmed golden
  // koi silhouette teaser ("Legend Incoming") — an invitation while the day's
  // legend has not appeared. It disappears once the first legend of the day is
  // chosen (then the real gold koi takes over). Recomputed on legendary updates.
  const [teaseLegend, setTeaseLegend] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    const update = () => setTeaseLegend(shouldTeaseLegend(getTodayLegendaryList()));
    update();
    const settle = setTimeout(update, 400);
    const unsub = aquascapeEvents.onLegendaryUpdated(update);
    return () => {
      clearTimeout(settle);
      unsub();
    };
  }, [isOpen]);

  // Clean mode: hide all Zen UI (header, telemetry HUD, buttons, controls, tips)
  // AND the fish nametags, leaving only the aquarium for a distraction-free view.
  const [cleanMode, setCleanMode] = useState(false);
  // When clean, force nametags off on the canvas without mutating the user's own
  // setting, so exiting clean mode restores their previous nametag preference.
  const canvasSettings = cleanMode ? { ...settings, showNametags: false } : settings;

  // Live biotope telemetry: base values follow the aquarium controls (lighting
  // warms/cools the water; the CO2 diffuser raises CO2 and lowers pH), with a
  // small random fluctuation on top so the sensors read like they are alive.
  const [telemetry, setTelemetry] = useState(() => computeTelemetry(settings));
  useEffect(() => {
    if (!isOpen) return;
    setTelemetry(computeTelemetry(settings)); // snap to new base on setting change
    const id = setInterval(() => setTelemetry(computeTelemetry(settings)), 3000);
    return () => clearInterval(id);
  }, [isOpen, settings.lighting, settings.co2Active]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isLeaderboardOpen) {
          setIsLeaderboardOpen(false);
        } else if (isFaunaModalOpen) {
          setIsFaunaModalOpen(false);
        } else if (cleanMode) {
          setCleanMode(false); // ESC first restores the UI, a second ESC closes Zen
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
  }, [isOpen, onClose, isFaunaModalOpen, isLeaderboardOpen, cleanMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white animate-fade-in overflow-hidden">
      {/* 1. Fullscreen Living Aquascape Simulation Canvas */}
      <div className="relative flex-1 w-full h-full">
        <AquascapeCanvas
          settings={canvasSettings}
          className="w-full h-full"
          isHeroOnly={false}
          cleanMode={cleanMode}
          onRegenerate={onRegenerate}
        />

        {/* Clean-mode toggle: always visible so the user can restore the UI.
            Sits at the top-right; dim by default, clearer on hover. */}
        <button
          type="button"
          onClick={() => setCleanMode((v) => !v)}
          className={`absolute bottom-4 left-4 z-40 flex items-center justify-center w-9 h-9 rounded-xl border backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
            cleanMode
              ? 'bg-black/30 border-white/10 text-white/40 hover:text-white hover:bg-black/50'
              : 'bg-slate-900/80 border-teal-500/30 text-teal-300 hover:bg-slate-800'
          }`}
          title={cleanMode ? 'Tampilkan antarmuka' : 'Mode bersih (sembunyikan antarmuka)'}
          aria-label={cleanMode ? 'Tampilkan antarmuka' : 'Mode bersih'}
        >
          {cleanMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* Top Header Bar */}
        {!cleanMode && (
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
              <span>{telemetry.temperature}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>{telemetry.ph}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{telemetry.co2}</span>
            </div>
            {/* Regenerasi only makes sense with the life cycle on (local mode). */}
            {!supabaseMode && settings.enableLifeCycle !== false && (
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

            {/* Realtime viewer count — same shared presence number as the landing
                header. Hidden when there are no viewers / Supabase is off. */}
            {viewerCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-emerald-400/30 text-emerald-200 font-semibold text-xs shadow-lg backdrop-blur-md"
                title="Sedang menonton sekarang"
                aria-live="polite"
                aria-label={`${viewerCount} ${viewerCount === 1 ? 'View' : 'Views'} sedang menonton`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="tabular-nums">{viewerCount}</span>
                <span className="hidden sm:inline text-emerald-300/70 font-normal">
                  {viewerCount === 1 ? 'View' : 'Views'}
                </span>
              </div>
            )}

            {/* Live fish count — placed to the left of the Ranking button. */}
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-teal-500/20 text-teal-200 font-semibold text-xs shadow-lg backdrop-blur-md"
              title="Jumlah ikan di akuarium"
            >
              <Fish className="w-4 h-4 text-teal-400" />
              <span>{fishCount}</span>
              <span className="hidden sm:inline text-teal-300/70 font-normal">ikan</span>
            </div>

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
        )}

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

        {/* "Legend Incoming" teaser: no legend has been born yet today. Shows a
            dimmed golden koi silhouette as an invitation until the day's first
            legend appears. Supabase-only (list is empty otherwise); hidden in
            clean mode and once a legend exists (teaseLegend goes false). */}
        {!cleanMode && supabaseMode && teaseLegend && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-950/60 via-yellow-900/40 to-amber-950/60 backdrop-blur-md shadow-[0_0_16px_rgba(255,215,0,0.2)]">
              <LegendaryKoiSilhouette size={40} />
              <div className="leading-tight">
                <p className="text-sm font-bold text-amber-200/90 tracking-wide">
                  Legend Incoming
                </p>
                <p className="text-[10px] text-amber-300/70 font-mono">
                  Sang koi legendaris belum lahir hari ini
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Bottom Aquascape Controls */}
        {!cleanMode && (
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
        )}
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

