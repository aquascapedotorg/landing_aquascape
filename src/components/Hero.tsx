import React from 'react';
import { AquascapeBanner } from './AquascapeLogo';
import { AquascapeCanvas } from './AquascapeCanvas';
import { AquascapeControls } from './AquascapeControls';
import { AquascapeSettings, ReposData } from '../types';
import { FolderGit2, Code2, Clock, Info } from 'lucide-react';

interface HeroProps {
  data: ReposData;
  settings: AquascapeSettings;
  onUpdateSettings: (newSettings: Partial<AquascapeSettings>) => void;
  onFeedFish: () => void;
  onRegenerate?: (count?: number) => void;
}

export const Hero: React.FC<HeroProps> = ({
  data,
  settings,
  onUpdateSettings,
  onFeedFish,
  onRegenerate,
}) => {
  // Count stats
  const totalRepos = data.repos.length;
  const uniqueLanguages = new Set(data.repos.map((r) => r.language).filter(Boolean)).size;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden border-b border-teal-500/20">
      {/* 1. Integrated Living Aquascape Tank as the Hero Background */}
      <div className="absolute inset-0 z-0">
        <AquascapeCanvas
          settings={settings}
          isHeroOnly={true}
          className="w-full h-full opacity-70"
          onRegenerate={onRegenerate}
        />

        {/* Ambient vignette and overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b12]/75 via-[#0a1522]/60 to-[#070b12] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,176,0.06)_0%,transparent_70%)] pointer-events-none" />
      </div>

      {/* 2. Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Organization Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/60 border border-teal-400/30 text-teal-300 text-xs font-semibold tracking-wider uppercase mb-6 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Open Source Organization & Engineering</span>
        </div>

        {/* Brand Banner Heading: "Proyek dari [AQUASCAPE Banner]" */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6 inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 select-none">
          <span className="text-slate-100 font-bold">Proyek dari</span>
          <AquascapeBanner height="1.18em" />
        </h1>

        {/* Tagline Description */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8 font-normal drop-shadow-sm">
          Menghadirkan harmoni rekayasa perangkat lunak dengan filosofi keindahan alami{' '}
          <span className="text-teal-300 font-medium">aquascape</span>. Jelajahi repositori,
          arsitektur sistem, dan dokumentasi proyek kami di bawah ini.
        </p>

        {/* Interactive Aquascape Ecosystem Controls */}
        <div className="mb-10 flex flex-col items-center gap-2.5">
          <AquascapeControls
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onFeedFish={onFeedFish}
          />
          <p className="text-[11px] text-teal-300/80 font-mono flex items-center gap-1.5 drop-shadow">
            <Info className="w-3 h-3 text-teal-400" />
            <span>Klik di kanvas atau tekan &quot;Tabur Kuaci&quot; untuk berinteraksi langsung dengan ikan maskot!</span>
          </p>
        </div>

        {/* Statistics Metric Badges */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-xl">
          {/* Repositories */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-700/50 hover:border-teal-500/30 transition-all">
            <div className="flex items-center gap-1.5 text-teal-400 mb-1">
              <FolderGit2 className="w-4 h-4" />
              <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                {totalRepos}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider font-medium">
              Repositories
            </span>
          </div>

          {/* Languages */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-700/50 hover:border-teal-500/30 transition-all">
            <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
              <Code2 className="w-4 h-4" />
              <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                {uniqueLanguages}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider font-medium">
              Languages
            </span>
          </div>

          {/* Last Updated */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-700/50 hover:border-teal-500/30 transition-all">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm sm:text-base font-bold text-white truncate max-w-[120px]">
                {formatDate(data.generated_at)}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider font-medium">
              Last Updated
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
