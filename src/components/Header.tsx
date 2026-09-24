import React, { useState, useEffect } from 'react';
import { AquascapeLogo } from './AquascapeLogo';
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { aquascapeAudio } from './AquascapeAudio';
import { ViewerCounter } from './ViewerCounter';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  zenMode: boolean;
  onToggleZen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  zenMode,
  onToggleZen,
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="site-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#070e17]/90 backdrop-blur-xl border-b border-teal-500/15 py-3 shadow-lg shadow-black/40'
          : 'bg-transparent py-4 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#"
          className="group flex items-center gap-3 select-none"
          aria-label="AQUASCAPE.org Beranda"
        >
          <AquascapeLogo size={36} />
          <div className="flex items-baseline">
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-teal-300 transition-colors">
              AQUASCAPE
            </span>
            <span className="text-sm font-semibold text-[#38bdb0] ml-0.5 tracking-wider">
              .org
            </span>
          </div>
        </a>

        {/* Navigation & Utilities */}
        <nav className="flex items-center gap-3 sm:gap-5">
          {/* Realtime viewer count */}
          <ViewerCounter />

          {/* Quick Sound Toggle in Header */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}
            title={soundEnabled ? 'Matikan suara gemericik air' : 'Nyalakan suara air alami'}
            aria-label="Toggle suara ambient"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 animate-pulse text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Quick Zen Mode Toggle */}
          <button
            type="button"
            onClick={onToggleZen}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              zenMode
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-300 hover:text-teal-300 hover:border-teal-500/30'
            }`}
            title="Layar Penuh Aquarium Zen"
          >
            {zenMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Keluar Zen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Aquarium Zen</span>
              </>
            )}
          </button>

          {/* Nav Links */}
          <a
            href="#projects"
            className="text-sm font-medium text-slate-300 hover:text-teal-300 transition-colors hidden md:inline-block"
          >
            Projects
          </a>

          {/* GitHub Organization Link */}
          <a
            href="https://github.com/aquascapedotorg"
            target="_blank"
            rel="noopener noreferrer"
            id="github-org-link"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-700/70 hover:border-teal-400/50 bg-slate-900/60 hover:bg-slate-850 text-sm font-medium text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <svg
              className="w-4 h-4 fill-current text-slate-200"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span>GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
};
