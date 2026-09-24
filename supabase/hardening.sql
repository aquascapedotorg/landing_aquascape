-- ==============================================================================
-- AQUASCAPE HARDENING — tutup celah spam/inject pada communal_fishes
-- Jalankan di Supabase Dashboard -> SQL Editor (setelah schema.sql & legendary.sql).
-- Aman untuk dijalankan ulang (idempoten).
-- ==============================================================================
--
-- MASALAH yang ditutup:
--   Sebelumnya siapa pun dengan anon key (terlihat di bundle browser) bisa
--   INSERT ikan langsung tanpa batas. Ini memungkinkan:
--     - membanjiri kolam dengan ribuan ikan;
--     - "menambang" legendary: tiap ikan di-roll ~1%, jadi menyuntik ribuan ikan
--       hampir pasti memenangkan legendary.
--
-- SOLUSI:
--   1. Cabut hak INSERT publik langsung -> communal_fishes jadi read-only utk anon.
--   2. Satu-satunya jalur tambah ikan = RPC add_communal_fish() (SECURITY DEFINER)
--      yang memvalidasi nama, memfilter kata kasar, menormalkan species, dan
--      menerapkan rate limit (global/menit + per-nama/hari).
--   3. Webhook diarahkan memanggil RPC ini (lihat docs/WEBHOOK.md).
-- ==============================================================================

-- 1. CABUT insert publik langsung. communal_fishes kini read-only untuk anon;
--    penambahan hanya lewat RPC ber-SECURITY DEFINER di bawah.
drop policy if exists "Allow public insert access" on public.communal_fishes;

-- 2. Daftar species yang valid (samakan dgn VALID_FISH_SPECIES di aplikasi).
--    Nilai tak dikenal / kosong akan di-fallback ke 'neonTetra'.
create or replace function public.normalize_species(p_species text)
returns text
language plpgsql
immutable
as $$
declare
  s text := lower(btrim(coalesce(p_species, '')));
begin
  -- Alias Indonesia/umum -> id resmi
  s := case s
    when 'tetra' then 'neontetra'
    when 'neon' then 'neontetra'
    when 'hiu' then 'shark'
    when 'paus' then 'whale'
    when 'lumba' then 'dolphin'
    when 'lumba-lumba' then 'dolphin'
    when 'pari' then 'mantaray'
    when 'manta' then 'mantaray'
    when 'buntal' then 'pufferfish'
    when 'puffer' then 'pufferfish'
    when 'layang' then 'angelfish'
    when 'manfish' then 'angelfish'
    when 'udang' then 'cherryshrimp'
    when 'shrimp' then 'cherryshrimp'
    when 'penyu' then 'turtle'
    when 'pembunuh' then 'orca'
    when 'paus orca' then 'orca'
    -- Spesies deep-sea baru (samakan dgn normalizeFishSpecies di client).
    -- 'belut listrik'/'listrik' -> electricEel; 'belut'/'sidat' -> moray.
    when 'ikan pedang' then 'marlin'
    when 'pedang' then 'marlin'
    when 'todak' then 'marlin'
    when 'pemancing' then 'anglerfish'
    when 'ikan pemancing' then 'anglerfish'
    when 'sungut ganda' then 'anglerfish'
    when 'lentera' then 'lanternfish'
    when 'ikan lentera' then 'lanternfish'
    when 'viper' then 'viperfish'
    when 'ikan viper' then 'viperfish'
    when 'ular' then 'viperfish'
    when 'belut listrik' then 'electriceel'
    when 'listrik' then 'electriceel'
    when 'belut moray' then 'moray'
    when 'belut' then 'moray'
    when 'sidat' then 'moray'
    else s
  end;

  -- Cocokkan case-insensitive ke id kanonik (kembalikan ejaan camelCase yg benar).
  return case s
    when 'mascot' then 'mascot'
    when 'neontetra' then 'neonTetra'
    when 'cherryshrimp' then 'cherryShrimp'
    when 'angelfish' then 'angelfish'
    when 'rasbora' then 'rasbora'
    when 'guppy' then 'guppy'
    when 'shark' then 'shark'
    when 'whale' then 'whale'
    when 'dolphin' then 'dolphin'
    when 'mantaray' then 'mantaRay'
    when 'pufferfish' then 'pufferfish'
    when 'orca' then 'orca'
    when 'turtle' then 'turtle'
    when 'marlin' then 'marlin'
    when 'anglerfish' then 'anglerfish'
    when 'lanternfish' then 'lanternfish'
    when 'viperfish' then 'viperfish'
    when 'moray' then 'moray'
    when 'electriceel' then 'electricEel'
    else 'neonTetra' -- fallback aman
  end;
end;
$$;

-- 3. Filter kata kasar sederhana (ID + EN). Kembalikan true bila nama mengandung
--    salah satu kata terlarang (pencocokan substring, case-insensitive).
--    Edit daftar di bawah kapan saja. Disengaja konservatif agar tak over-block.
create or replace function public.name_has_profanity(p_name text)
returns boolean
language plpgsql
immutable
as $$
declare
  n text := lower(coalesce(p_name, ''));
  w text;
  banned text[] := array[
    -- Indonesia
    'anjing','anjeng','bangsat','bajingan','kontol','memek','ngentot',' entot',
    'kampret','goblok','tolol','bego','babi','pepek','jancok','jancuk','asu',
    'perek','pelacur','lonte','tai','taik','setan','bangke',' pki ',
    -- English
    'fuck','shit','bitch','cunt','asshole','dick','pussy','nigger','faggot',
    'whore','slut','bastard','motherfucker','retard'
  ];
begin
  -- Beri padding spasi agar pola ber-spasi seperti ' pki ' bisa dicek di ujung.
  n := ' ' || regexp_replace(n, '\s+', ' ', 'g') || ' ';
  foreach w in array banned loop
    if position(w in n) > 0 then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

-- 4. RPC penambah ikan: SATU-SATUNYA jalur tulis publik ke communal_fishes.
--    Mengembalikan baris JSON yang dibuat, atau melempar error yang jelas bila
--    ditolak (agar pemanggil/webhook tahu alasannya).
--
--    Rate limit:
--      - GLOBAL: maksimal 50 insert dalam 60 detik terakhir (seluruh tabel).
--      - PER-NAMA/HARI: nama yang sama maksimal 3x per hari.
create or replace function public.add_communal_fish(p_name text, p_species text default null)
returns public.communal_fishes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name    text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_species text;
  v_recent  int;
  v_same    int;
  v_row     public.communal_fishes;
begin
  -- Validasi nama
  if char_length(v_name) < 1 or char_length(v_name) > 100 then
    raise exception 'invalid_name' using hint = 'Nama wajib 1-100 karakter.';
  end if;

  -- Filter kata kasar
  if public.name_has_profanity(v_name) then
    raise exception 'name_rejected' using hint = 'Nama mengandung kata yang tidak diperbolehkan.';
  end if;

  -- Normalisasi species
  v_species := public.normalize_species(p_species);

  -- Rate limit GLOBAL: maks 50 dalam 60 detik terakhir
  select count(*) into v_recent
  from public.communal_fishes
  where created_at > now() - interval '60 seconds';
  if v_recent >= 50 then
    raise exception 'rate_limited_global' using hint = 'Terlalu banyak ikan masuk sekarang. Coba lagi sebentar.';
  end if;

  -- Rate limit PER-NAMA/HARI: maks 3 nama sama per hari
  select count(*) into v_same
  from public.communal_fishes
  where entry_date = current_date
    and btrim(regexp_replace(name, '\s+', ' ', 'g')) = v_name;
  if v_same >= 3 then
    raise exception 'rate_limited_name' using hint = 'Nama ini sudah mencapai batas hari ini.';
  end if;

  insert into public.communal_fishes (name, species)
  values (v_name, v_species)
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.add_communal_fish(text, text) to anon;

-- Catatan: increment_kuaci, upsert_streaks, roll_legendary, dan tabel-tabel
-- legendary_fish/fish_daily_kuaci/fish_streaks SUDAH aman (read-only + RPC
-- ber-clamp/idempoten). Lihat legendary.sql & streak.sql.
