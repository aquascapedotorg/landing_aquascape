import React, { useState, useEffect } from 'react';
import { X, Sliders, Tag, Check, RefreshCw, Edit3 } from 'lucide-react';
import { AquascapeSettings, FishParticle, FishSpeciesType } from '../types';
import { FISH_CATALOG } from '../data/fishCatalog';

interface FishCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AquascapeSettings;
  onUpdateSettings: (newSettings: Partial<AquascapeSettings>) => void;
}

export const FishCustomizerModal: React.FC<FishCustomizerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [fishList, setFishList] = useState<FishParticle[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const currentSpecies: FishSpeciesType[] = settings.activeSpecies || [
    'mascot',
    'neonTetra',
    'cherryShrimp',
    'angelfish',
    'rasbora',
    'guppy',
  ];

  const currentDensity = settings.fishDensity || 10;
  const showNametags = settings.showNametags || false;

  // Refresh fish list from canvas
  const refreshList = () => {
    const getter = (window as unknown as { __aquascapeGetFishList?: () => FishParticle[] })
      .__aquascapeGetFishList;
    if (typeof getter === 'function') {
      const list = getter();
      setFishList([...list]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen, settings.fishDensity, settings.activeSpecies]);

  if (!isOpen) return null;

  const toggleSpecies = (speciesId: FishSpeciesType) => {
    let next: FishSpeciesType[];
    if (currentSpecies.includes(speciesId)) {
      if (currentSpecies.length <= 1) return; // keep at least 1
      next = currentSpecies.filter((s) => s !== speciesId);
    } else {
      next = [...currentSpecies, speciesId];
    }
    onUpdateSettings({ activeSpecies: next });
    setTimeout(refreshList, 80);
  };

  const handleDensityChange = (density: number) => {
    onUpdateSettings({ fishDensity: density });
    setTimeout(refreshList, 80);
  };

  const handleStartRename = (fish: FishParticle) => {
    setEditingId(fish.id);
    setEditingName(fish.name);
  };

  const handleSaveRename = (id: number) => {
    const renamer = (window as unknown as { __aquascapeRenameFish?: (id: number, name: string) => void })
      .__aquascapeRenameFish;
    if (typeof renamer === 'function' && editingName.trim()) {
      renamer(id, editingName.trim());
      refreshList();
    }
    setEditingId(null);
  };

  const handleApplyPreset = (preset: 'all' | 'schooling' | 'minimalist') => {
    if (preset === 'all') {
      onUpdateSettings({
        fishDensity: 12,
        activeSpecies: ['mascot', 'neonTetra', 'cherryShrimp', 'angelfish', 'rasbora', 'guppy'],
      });
    } else if (preset === 'schooling') {
      onUpdateSettings({
        fishDensity: 16,
        activeSpecies: ['neonTetra', 'rasbora', 'guppy'],
      });
    } else if (preset === 'minimalist') {
      onUpdateSettings({
        fishDensity: 5,
        activeSpecies: ['mascot', 'angelfish'],
      });
    }
    setTimeout(refreshList, 80);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[#0b131e] border border-teal-500/30 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-teal-500/20 bg-[#070e17]/80">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-bold text-white tracking-wide font-mono">
              Kustomisasi Fauna & Nama Ikan
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-semibold text-teal-300/80 uppercase tracking-wider mb-2">
              Preset Komposisi
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('all')}
                className="px-2.5 py-1.5 rounded-xl border border-teal-500/20 bg-slate-900/60 hover:bg-teal-500/20 hover:border-teal-400/50 transition-all font-medium text-center cursor-pointer"
              >
                🌿 Ekosistem Lengkap
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('schooling')}
                className="px-2.5 py-1.5 rounded-xl border border-teal-500/20 bg-slate-900/60 hover:bg-teal-500/20 hover:border-teal-400/50 transition-all font-medium text-center cursor-pointer"
              >
                🐟 Schooling Ramai
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('minimalist')}
                className="px-2.5 py-1.5 rounded-xl border border-teal-500/20 bg-slate-900/60 hover:bg-teal-500/20 hover:border-teal-400/50 transition-all font-medium text-center cursor-pointer"
              >
                🪷 Zen Minimalis
              </button>
            </div>
          </div>

          {/* Population Density Slider */}
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-teal-500/15">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200">Kepadatan Ikan</span>
              <span className="font-mono text-teal-300 font-bold px-2 py-0.5 rounded bg-teal-500/20">
                {currentDensity} Ekor
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={25}
              step={1}
              value={currentDensity}
              onChange={(e) => handleDensityChange(parseInt(e.target.value, 10))}
              className="w-full accent-teal-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>3 (Sepi/Tenang)</span>
              <span>12 (Seimbang)</span>
              <span>25 (Ramai)</span>
            </div>
          </div>

          {/* Species Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-teal-300/80 uppercase tracking-wider mb-2">
              Pilihan Spesies Aktif
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FISH_CATALOG.species.map((sp) => {
                const isActive = currentSpecies.includes(sp.id);
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => toggleSpecies(sp.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-500/15 border-teal-400/50 text-white'
                        : 'bg-slate-900/30 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs leading-tight">{sp.name}</div>
                      <div className="text-[10px] opacity-70 italic font-mono">{sp.scientificName}</div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nametag Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-teal-500/15">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-teal-400" />
              <div>
                <div className="font-semibold text-slate-200">Tampilkan Nama Ikan (Always-on)</div>
                <div className="text-[10px] text-slate-400">
                  Jika mati, nama hanya akan muncul saat kursor didekatkan ke ikan.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ showNametags: !showNametags })}
              className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                showNametags ? 'bg-teal-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  showNametags ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Fish Roster & Custom Rename */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-teal-300/80 uppercase tracking-wider">
                Daftar Ikan di Akuarium ({fishList.length})
              </label>
              <button
                type="button"
                onClick={refreshList}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-teal-300 cursor-pointer transition-colors"
                title="Muat ulang daftar ikan"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {fishList.map((fish, index) => {
                const isEditing = editingId === fish.id;
                return (
                  <div
                    key={fish.id || index}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(fish.id)}
                          autoFocus
                          className="bg-slate-950 border border-teal-400/60 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                        />
                      ) : (
                        <div>
                          <span className="font-bold text-white mr-1.5">{fish.name}</span>
                          <span className="text-[10px] text-teal-300/70 capitalize font-mono">
                            ({fish.type})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{fish.eatenCount || 0} kuaci</span>
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleSaveRename(fish.id)}
                          className="px-2 py-0.5 bg-teal-500 text-slate-950 rounded font-semibold hover:bg-teal-400 transition-colors"
                        >
                          Simpan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartRename(fish)}
                          className="p-1 hover:text-teal-300 transition-colors cursor-pointer"
                          title="Ganti nama ikan"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-teal-500/20 bg-[#070e17]/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
