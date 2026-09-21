import React from 'react';
import { Sun, Moon, Sunset, Layers, Wind, Volume2, VolumeX, Maximize2, Minimize2, Fish } from 'lucide-react';
import { AquascapeSettings, LightingMode } from '../types';
import { aquascapeAudio } from './AquascapeAudio';
import { KuaciIcon } from './KuaciIcon';

interface ControlsProps {
  settings: AquascapeSettings;
  onUpdateSettings: (newSettings: Partial<AquascapeSettings>) => void;
  onFeedFish: () => void;
  className?: string;
}

export const AquascapeControls: React.FC<ControlsProps> = ({
  settings,
  onUpdateSettings,
  onFeedFish,
  className = '',
}) => {
  const toggleSound = () => {
    const isNowPlaying = aquascapeAudio.toggle();
    onUpdateSettings({ soundEnabled: isNowPlaying });
  };

  const handleLightingChange = (mode: LightingMode) => {
    onUpdateSettings({ lighting: mode });
  };

  const handleWaterFlowCycle = () => {
    const nextFlow: Record<'calm' | 'normal' | 'lively', 'calm' | 'normal' | 'lively'> = {
      calm: 'normal',
      normal: 'lively',
      lively: 'calm',
    };
    onUpdateSettings({ waterFlow: nextFlow[settings.waterFlow] });
  };

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-[#09131d]/85 backdrop-blur-md rounded-2xl border border-teal-500/25 shadow-xl shadow-cyan-950/40 ${className}`}
    >
      {/* 1. Feed Fish / Tabur Kuaci Button */}
      <button
        type="button"
        id="btn-feed-fish"
        onClick={onFeedFish}
        className="group relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-teal-500/25 to-emerald-500/25 border border-teal-400/40 text-teal-200 hover:text-white hover:border-teal-300 transition-all active:scale-95 cursor-pointer shadow-sm"
        title="Taburkan kuaci ke dalam aquascape (Bisa juga langsung klik di kanvas)"
      >
        <KuaciIcon className="w-3.5 h-3.5 text-teal-300 group-hover:rotate-12 transition-transform" />
        <span>Tabur Kuaci</span>
        <span className="hidden sm:inline text-[10px] opacity-70">Kuaci</span>
      </button>

      {/* 2. Lighting Mode Switcher */}
      <div className="flex items-center rounded-xl bg-slate-900/60 p-0.5 border border-slate-700/60">
        <button
          type="button"
          id="btn-light-day"
          onClick={() => handleLightingChange('daylight')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
            settings.lighting === 'daylight'
              ? 'bg-teal-500/30 text-teal-200 shadow-sm border border-teal-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Pencahayaan Siang Hari (ADA Nature Daylight)"
        >
          <Sun className="w-3 h-3 text-amber-300" />
          <span className="hidden md:inline">Siang</span>
        </button>

        <button
          type="button"
          id="btn-light-golden"
          onClick={() => handleLightingChange('golden')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
            settings.lighting === 'golden'
              ? 'bg-amber-500/30 text-amber-200 shadow-sm border border-amber-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Pencahayaan Senja (Golden Hour)"
        >
          <Sunset className="w-3 h-3 text-amber-400" />
          <span className="hidden md:inline">Senja</span>
        </button>

        <button
          type="button"
          id="btn-light-moon"
          onClick={() => handleLightingChange('moonlight')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
            settings.lighting === 'moonlight'
              ? 'bg-indigo-500/30 text-indigo-200 shadow-sm border border-indigo-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Pencahayaan Malam (Moonlight Twilight)"
        >
          <Moon className="w-3 h-3 text-indigo-300" />
          <span className="hidden md:inline">Malam</span>
        </button>
      </div>

      {/* 3. CO2 Diffuser Toggle */}
      <button
        type="button"
        id="btn-co2-toggle"
        onClick={() => onUpdateSettings({ co2Active: !settings.co2Active })}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
          settings.co2Active
            ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
            : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
        }`}
        title="Nyalakan / Matikan diffuser CO2 micro-bubbles"
      >
        <Layers className={`w-3 h-3 ${settings.co2Active ? 'text-cyan-300' : 'text-slate-500'}`} />
        <span>CO2 Diffuser</span>
      </button>

      {/* 4. Water Flow Toggle */}
      <button
        type="button"
        id="btn-waterflow-toggle"
        onClick={handleWaterFlowCycle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-900/40 border border-slate-700/60 text-slate-300 hover:text-teal-200 hover:border-teal-500/40 transition-all cursor-pointer"
        title={`Kecepatan arus air saat ini: ${settings.waterFlow}. Klik untuk mengubah.`}
      >
        <Wind className={`w-3 h-3 text-teal-400 ${settings.waterFlow === 'lively' ? 'animate-bounce' : ''}`} />
        <span className="capitalize">{settings.waterFlow}</span>
      </button>

      {/* 5. Ambient Water Sound Toggle */}
      <button
        type="button"
        id="btn-sound-toggle"
        onClick={toggleSound}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
          settings.soundEnabled
            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 shadow-sm'
            : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
        }`}
        title={settings.soundEnabled ? 'Matikan suara gemericik air' : 'Nyalakan suara gemericik air & filter alami'}
      >
        {settings.soundEnabled ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Suara Air</span>
          </>
        ) : (
          <>
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Mute</span>
          </>
        )}
      </button>

      {/* 6. Zen Mode Toggle */}
      <button
        type="button"
        id="btn-zen-mode"
        onClick={() => onUpdateSettings({ zenMode: !settings.zenMode })}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
          settings.zenMode
            ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/30'
            : 'bg-teal-950/40 border-teal-500/30 text-teal-300 hover:bg-teal-900/40'
        }`}
        title="Mode Zen Aquascape: Nikmati aquarium visual layar penuh"
      >
        {settings.zenMode ? (
          <>
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Tutup Zen</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Mode Zen</span>
          </>
        )}
      </button>
    </div>
  );
};
