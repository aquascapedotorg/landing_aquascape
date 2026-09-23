-- ==============================================================================
-- AQUASCAPE — PEMBERSIH NAMA (jalankan di Supabase Dashboard -> SQL Editor)
-- ==============================================================================
-- Tujuan: merapikan nama peserta yang punya spasi berlebih (depan/belakang/ganda)
-- di communal_fishes, lalu menyegarkan snapshot fish_streaks agar dihitung ulang
-- bersih. Streak SELALU dihitung ulang dari communal_fishes (kehadiran), jadi
-- mengosongkan fish_streaks aman — app mengisi ulang otomatis dalam ~10 detik.
--
-- Jalankan BAGIAN 1 dan 2. BAGIAN 3 (typo huruf) OPSIONAL — edit sendiri.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BAGIAN 1: Rapikan spasi pada communal_fishes (trim + spasi ganda -> satu)
-- ------------------------------------------------------------------------------
-- regexp_replace(..., '\s+', ' ', 'g') menyatukan spasi ganda; btrim() memangkas
-- spasi di ujung. Hanya baris yang benar-benar berubah yang tersentuh.
update public.communal_fishes
set name = btrim(regexp_replace(name, '\s+', ' ', 'g'))
where name <> btrim(regexp_replace(name, '\s+', ' ', 'g'));

-- (Opsional) rapikan juga fish_daily_kuaci bila ada nama ber-spasi di sana:
update public.fish_daily_kuaci
set name = btrim(regexp_replace(name, '\s+', ' ', 'g'))
where name <> btrim(regexp_replace(name, '\s+', ' ', 'g'));

-- Catatan: bila BAGIAN 1 pada fish_daily_kuaci menimbulkan bentrok primary key
-- (nama+tanggal jadi sama setelah di-trim), gabungkan dulu dengan query berikut,
-- BARU jalankan update di atas:
--   -- gabung kuaci varian spasi untuk tanggal yang sama:
--   -- (uncomment bila perlu)
--   -- update public.fish_daily_kuaci k set kuaci_count = agg.total
--   -- from (
--   --   select btrim(regexp_replace(name,'\s+',' ','g')) as n, entry_date, sum(kuaci_count) total
--   --   from public.fish_daily_kuaci group by 1,2
--   -- ) agg
--   -- where btrim(regexp_replace(k.name,'\s+',' ','g'))=agg.n and k.entry_date=agg.entry_date;
--   -- lalu hapus duplikat menyisakan satu baris, baru jalankan update trim.

-- ------------------------------------------------------------------------------
-- BAGIAN 2: Segarkan snapshot fish_streaks
-- ------------------------------------------------------------------------------
-- Kosongkan snapshot; app akan menuliskannya ulang dengan nama ter-normalisasi
-- dan streak yang benar. current_streak & best_streak keduanya diturunkan dari
-- kehadiran, jadi tidak ada rekor yang hilang selama baris communal_fishes utuh.
truncate table public.fish_streaks;

-- Alternatif lebih hati-hati (bila tak mau truncate semua): hapus hanya baris
-- yang namanya berbeda dari versi ter-trim (mis. "Piki Rahmadi ") — sisa nama
-- bersih akan ditimpa app pada siklus snapshot berikutnya:
--   delete from public.fish_streaks
--   where name <> btrim(regexp_replace(name, '\s+', ' ', 'g'));

-- ------------------------------------------------------------------------------
-- BAGIAN 3 (OPSIONAL): Perbaiki typo huruf — HANYA bila yakin orang yang sama.
-- ------------------------------------------------------------------------------
-- Normalisasi otomatis TIDAK menggabungkan typo huruf (mis. "Dyawana" vs
-- "Dwayana") karena berisiko salah gabung. Perbaiki manual dengan template ini,
-- ganti nilai sesuai kasus Anda, lalu jalankan ulang BAGIAN 2 (truncate).
--
--   update public.communal_fishes
--   set name = 'Pandu Dwayana Putra'          -- ejaan yang benar
--   where name = 'Pandu Dyawana Putra';       -- ejaan typo
--
--   update public.fish_daily_kuaci
--   set name = 'Pandu Dwayana Putra'
--   where name = 'Pandu Dyawana Putra';
--
-- (Untuk kasus Pandu di data Anda, communal_fishes SUDAH diperbaiki; yang tersisa
--  hanya baris basi di fish_streaks yang akan hilang oleh truncate BAGIAN 2.)
