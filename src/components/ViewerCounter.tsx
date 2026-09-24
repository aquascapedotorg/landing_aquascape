import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { subscribeToViewerCount } from '../services/presenceService';

/**
 * Badge realtime "N View/Views". Menampilkan jumlah orang yang sedang membuka
 * situs (Supabase Presence). Tersembunyi bila Supabase tidak terkonfigurasi
 * atau belum ada viewer (count <= 0), agar tidak menampilkan angka palsu.
 */
export const ViewerCounter: React.FC = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToViewerCount(setCount);
    return unsubscribe;
  }, []);

  if (count <= 0) return null;

  const label = count === 1 ? 'View' : 'Views';

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
      title="Sedang menonton sekarang"
      aria-live="polite"
      aria-label={`${count} ${label} sedang menonton`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <Eye className="w-4 h-4" />
      <span className="text-xs font-semibold tabular-nums">
        {count} {label}
      </span>
    </div>
  );
};
