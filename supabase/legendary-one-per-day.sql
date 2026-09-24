-- ==============================================================================
-- AQUASCAPE — Batasi legendary MAKSIMAL 1 per hari
-- Patch untuk DB yang sudah menjalankan legendary.sql. Aman dijalankan ulang.
-- Jalankan di Supabase Dashboard -> SQL Editor.
-- ==============================================================================
--
-- Sebelumnya setiap ikan punya peluang ~1% independen, tanpa batas jumlah legend
-- per hari (bisa 0, 1, atau beberapa). Patch ini membatasi menjadi TEPAT SATU
-- legend per hari: ikan tetap "melempar dadu" (odds ~1% per ikan tetap, agar
-- legendary_rolled konsisten), tetapi tak bisa menang lagi begitu hari itu sudah
-- punya pemenang.
--
-- Dua lapis penjaga:
--   1. Aplikatif: RPC cek "sudah ada legend hari ini?" sebelum menang.
--   2. Atomik (anti-race): partial unique index pada entry_date -> insert kedua
--      untuk tanggal sama pasti gagal; RPC menangkapnya dan menganggap kalah.
-- ==============================================================================

-- Jika (kasus langka) sudah ada >1 legend di suatu hari sebelum patch ini,
-- unique index di bawah akan gagal dibuat. Bersihkan duplikat lebih dulu:
-- sisakan satu (yang menang paling awal) per entry_date.
delete from public.legendary_fish a
using public.legendary_fish b
where a.entry_date = b.entry_date
  and a.won_at > b.won_at;      -- buang yang lebih baru, simpan yang pertama

-- 1. Penjaga atomik: maksimal satu baris per entry_date.
create unique index if not exists uniq_legendary_one_per_day
  on public.legendary_fish (entry_date);

-- 2. RPC dengan batas satu-per-hari.
create or replace function public.roll_legendary(p_name text)
returns boolean
language plpgsql security definer as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g'));
  v_row  public.communal_fishes;
  v_win  boolean := false;
  v_has_today boolean;
begin
  if char_length(v_name) < 1 then return false; end if;

  select * into v_row
  from public.communal_fishes
  where btrim(regexp_replace(name,'\s+',' ','g')) = v_name
    and entry_date = current_date
    and legendary_rolled = false
  order by created_at desc
  limit 1
  for update skip locked;

  if not found then
    return false; -- already rolled (idempotent) or no eligible row today
  end if;

  update public.communal_fishes set legendary_rolled = true where id = v_row.id;

  -- Only one legendary per day: if today already has a winner, this fish cannot win.
  select exists(
    select 1 from public.legendary_fish where entry_date = current_date
  ) into v_has_today;
  if v_has_today then
    return false;
  end if;

  if random() < 0.01 then
    begin
      insert into public.legendary_fish (name, species, entry_date)
      values (v_name, v_row.species, current_date);
      v_win := true;
    exception when unique_violation then
      v_win := false; -- a concurrent roll won first this same day
    end;
  end if;

  return v_win;
end;
$$;

grant execute on function public.roll_legendary(text) to anon;
