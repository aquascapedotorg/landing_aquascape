import React, { useEffect } from 'react';
import { AquascapeCanvas } from './AquascapeCanvas';
import { AquascapeControls } from './AquascapeControls';
import { AquascapeSettings } from '../types';
import { Minimize2, Info, Droplets, Thermometer, Activity } from 'lucide-react';

interface ZenProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AquascapeSettings;
  onUpdateSettings: (newSettings: Partial<AquascapeSettings>) => void;
  onFeedFish: () => void;
}

export const ZenAquariumModal: React.FC<ZenProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onFeedFish,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white animate-fade-in overflow-hidden">
      {/* 1. Fullscreen Living Aquascape Simulation Canvas */}
      <div className="relative flex-1 w-full h-full">
        <AquascapeCanvas
          settings={settings}
          className="w-full h-full"
          isHeroOnly={false}
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
              <span>24.8°C</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>pH 6.6</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>CO2 ~28ppm</span>
            </div>
          </div>

          {/* Close Zen Button */}
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/30 cursor-pointer active:scale-95"
            title="Tutup Mode Zen (ESC)"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Kembali ke Proyek</span>
          </button>
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
            <span>Klik di mana saja pada aquarium untuk menyebarkan pakan ikan & menciptakan riak air alami</span>
          </p>
        </div>
      </div>
    </div>
  );
};
