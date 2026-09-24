import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getFishDataSourceConfig } from './supabaseFishService';

/**
 * Menghitung jumlah viewer unik dari objek presenceState Supabase.
 * Setiap KEY presence = satu viewer (satu tab), walau punya banyak entri.
 * Fungsi murni: tidak menyentuh jaringan, mudah diuji.
 */
export function countViewers(presenceState: Record<string, unknown[]>): number {
  if (!presenceState || typeof presenceState !== 'object') return 0;
  let total = 0;
  for (const key of Object.keys(presenceState)) {
    const entries = presenceState[key];
    if (Array.isArray(entries) && entries.length > 0) {
      total += 1;
    }
  }
  return total;
}

/**
 * Satu channel presence global untuk seluruh lifetime app. subscribeToViewerCount
 * dipanggil dari React effect yang bisa berjalan berkali-kali (StrictMode/HMR),
 * jadi kita jaga hanya SATU channel: pemanggilan ulang cukup menukar callback.
 */
interface ActivePresence {
  supabase: SupabaseClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel: any;
  onCountChange: (count: number) => void;
}

let activePresence: ActivePresence | null = null;

const CHANNEL_NAME = 'aquascape-presence';

function randomKey(): string {
  return `viewer_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

/**
 * Buka channel presence, track diri sendiri, dengarkan 'sync', dan panggil
 * onCountChange dengan jumlah viewer terbaru. Mengembalikan fungsi cleanup.
 *
 * Fallback aman: jika kredensial Supabase kosong / gagal → onCountChange(0)
 * dan cleanup no-op (badge akan tersembunyi).
 */
export function subscribeToViewerCount(
  onCountChange: (count: number) => void
): () => void {
  const { supabaseUrl, supabaseAnonKey } = getFishDataSourceConfig();

  // Config kosong → tidak ada presence. Badge tersembunyi.
  if (!supabaseUrl || !supabaseAnonKey) {
    onCountChange(0);
    return () => {};
  }

  // Sudah ada channel hidup: cukup tukar callback dan kirim angka terkini.
  if (activePresence) {
    activePresence.onCountChange = onCountChange;
    try {
      onCountChange(countViewers(activePresence.channel.presenceState()));
    } catch {
      onCountChange(0);
    }
    return () => {};
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: randomKey() } },
    });

    const sub: ActivePresence = { supabase, channel, onCountChange };
    activePresence = sub;

    channel
      .on('presence', { event: 'sync' }, () => {
        const current = activePresence;
        if (!current) return;
        try {
          current.onCountChange(countViewers(current.channel.presenceState()));
        } catch {
          current.onCountChange(0);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ online_at: Date.now() }).catch(() => {});
        }
      });

    return () => {
      // No-op saat re-render: channel process-global dijaga tetap hidup
      // (pola sama seperti supabaseFishService). Teardown nyata saat unload.
    };
  } catch (err) {
    console.warn('[Aquascape Presence] setup error:', err);
    onCountChange(0);
    return () => {};
  }
}
