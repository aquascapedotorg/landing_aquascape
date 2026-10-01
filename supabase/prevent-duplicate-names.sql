-- ==============================================================================
-- AQUASCAPE — CEGAH DUPLIKAT NAMA PERSIS DI communal_fishes
-- ==============================================================================
-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Aman dijalankan ulang (CREATE OR REPLACE, idempoten).
--
-- PERUBAHAN:
--   Sebelumnya: nama sama boleh masuk sampai 3x/hari (rate limit).
--   Sesudah:    nama persis yang sudah ada hari ini TIDAK di-insert ulang;
--               fungsi mengembalikan baris lama. Caller tetap dapat response
--               sukses (row JSON), jadi webhook/form tidak perlu diubah.
-- ==============================================================================

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

  -- ============================================================
  -- CEK DUPLIKAT: Jika nama persis sudah ada hari ini,
  -- kembalikan baris yang ada tanpa insert baru.
  -- ============================================================
  select * into v_row
  from public.communal_fishes
  where entry_date = current_date
    and btrim(regexp_replace(name, '\s+', ' ', 'g')) = v_name
  order by created_at asc
  limit 1;

  if found then
    -- Nama sudah ada hari ini -> return baris lama, tanpa duplikat
    return v_row;
  end if;

  -- Rate limit GLOBAL: maks 50 dalam 60 detik terakhir
  select count(*) into v_recent
  from public.communal_fishes
  where created_at > now() - interval '60 seconds';
  if v_recent >= 50 then
    raise exception 'rate_limited_global' using hint = 'Terlalu banyak ikan masuk sekarang. Coba lagi sebentar.';
  end if;

  -- INSERT baris baru (nama belum ada hari ini)
  insert into public.communal_fishes (name, species)
  values (v_name, v_species)
  returning * into v_row;

  -- Server-side legendary roll
  begin
    perform public.roll_legendary(v_name);
  exception when others then
    null; -- ignore: legendary is optional; the fish is already inserted
  end;

  return v_row;
end;
$$;

-- Pastikan anon tetap bisa memanggil RPC ini
grant execute on function public.add_communal_fish(text, text) to anon;
