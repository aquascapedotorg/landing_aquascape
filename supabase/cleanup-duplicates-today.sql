-- ==============================================================================
-- AQUASCAPE — HAPUS DUPLIKAT NAMA HARI INI DI communal_fishes
-- ==============================================================================
-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Aman dijalankan ulang (idempoten — kalau tidak ada duplikat, tidak ada yang terhapus).
--
-- LOGIKA:
--   Untuk setiap nama (setelah trim & normalize spasi) yang muncul lebih dari
--   1x pada hari ini (entry_date = current_date), SISAKAN hanya baris paling
--   awal (created_at terkecil) dan HAPUS sisanya.
--
--   Setelah ini, jalankan juga prevent-duplicate-names.sql agar ke depannya
--   tidak ada duplikat baru yang masuk.
-- ==============================================================================

-- 1. Preview: lihat duplikat apa saja yang akan dihapus.
--    Jalankan bagian ini DULU untuk melihat baris mana yang terduplikasi.
--    Comment kembali setelah selesai preview.

select
  id,
  name,
  species,
  created_at,
  entry_date
from public.communal_fishes
where entry_date = current_date
  and id not in (
    select min(id)
    from public.communal_fishes
    where entry_date = current_date
    group by btrim(regexp_replace(name, '\s+', ' ', 'g'))
  )
order by name, created_at;

-- 2. Hapus duplikat: sisakan hanya baris dengan id terkecil per nama per hari ini
delete from public.communal_fishes
where entry_date = current_date
  and id not in (
    select min(id)
    from public.communal_fishes
    where entry_date = current_date
    group by btrim(regexp_replace(name, '\s+', ' ', 'g'))
  );

-- 3. Segarkan snapshot fish_streaks agar streak dihitung ulang bersih
--    (streak diturunkan dari communal_fishes, jadi truncate aman — app mengisi
--    ulang otomatis dalam ~10 detik).
truncate table public.fish_streaks;
