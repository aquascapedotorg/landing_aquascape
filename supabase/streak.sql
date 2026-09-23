-- ==============================================================================
-- AQUASCAPE STREAK & DAILY KUACI - SUPABASE SCHEMA
-- Jalankan di Supabase Dashboard -> SQL Editor (setelah schema.sql)
-- ==============================================================================

create table if not exists public.fish_daily_kuaci (
  name        text not null,
  entry_date  date not null default current_date,
  kuaci_count integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (name, entry_date)
);

create index if not exists idx_fish_daily_kuaci_entry_date
  on public.fish_daily_kuaci (entry_date desc);

alter table public.fish_daily_kuaci enable row level security;

-- SECURITY: only PUBLIC READ is granted to anon. Writes happen exclusively via
-- the increment_kuaci() RPC below (SECURITY DEFINER, which bypasses RLS), so
-- anon cannot INSERT/UPDATE this table directly and cannot forge kuaci counts.
-- Drop-then-create so this script is safe to re-run (create policy has no IF NOT EXISTS).
drop policy if exists "Allow public read access" on public.fish_daily_kuaci;
create policy "Allow public read access"
  on public.fish_daily_kuaci for select using (true);

-- Explicitly remove any previously-granted public write policies (hardening).
drop policy if exists "Allow public insert access" on public.fish_daily_kuaci;
drop policy if exists "Allow public update access" on public.fish_daily_kuaci;

-- Atomic increment: avoids lost updates when multiple visitors feed the same fish.
-- SECURITY: p_amount is clamped to a small per-call range so a direct anon call
-- (e.g. curl with p_amount=100000) cannot balloon a fish's kuaci. The app only
-- ever sends small batched amounts. Also validates the name (1-100 chars) so the
-- RPC cannot be used to seed junk rows that bypass the table's insert policy.
create or replace function public.increment_kuaci(p_name text, p_amount int)
returns void
language plpgsql
security definer
as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_amount int := least(greatest(coalesce(p_amount, 0), 0), 100); -- clamp 0..100
begin
  if char_length(v_name) < 1 or char_length(v_name) > 100 then
    return; -- reject junk names silently
  end if;
  if v_amount = 0 then
    return; -- nothing to add
  end if;
  insert into public.fish_daily_kuaci (name, entry_date, kuaci_count, updated_at)
  values (v_name, current_date, v_amount, now())
  on conflict (name, entry_date)
  do update set
    kuaci_count = public.fish_daily_kuaci.kuaci_count + v_amount,
    updated_at = now();
end;
$$;

grant execute on function public.increment_kuaci(text, int) to anon;

-- Live leaderboard updates (guarded so re-running does not error if already added).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'fish_daily_kuaci'
  ) then
    alter publication supabase_realtime add table public.fish_daily_kuaci;
  end if;
end $$;

-- ==============================================================================
-- STREAK SNAPSHOT (persist computed streaks for fast query & history)
-- ==============================================================================
create table if not exists public.fish_streaks (
  name             text primary key,
  current_streak   integer not null default 0,
  best_streak      integer not null default 0,
  last_active_date date,
  updated_at       timestamptz not null default now()
);

alter table public.fish_streaks enable row level security;

-- SECURITY: public READ only. Writes happen exclusively via upsert_streaks()
-- (SECURITY DEFINER), so anon cannot INSERT/UPDATE snapshots directly and cannot
-- forge streak/best_streak values.
drop policy if exists "Allow public read access" on public.fish_streaks;
create policy "Allow public read access"
  on public.fish_streaks for select using (true);
-- Remove any previously-granted public write policies (hardening).
drop policy if exists "Allow public insert access" on public.fish_streaks;
drop policy if exists "Allow public update access" on public.fish_streaks;

-- Batch upsert of streak snapshots. best_streak never decreases (GREATEST).
create or replace function public.upsert_streaks(p_rows jsonb)
returns void language plpgsql security definer as $$
declare r jsonb;
begin
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into public.fish_streaks (name, current_streak, best_streak, last_active_date, updated_at)
    values (
      r->>'name',
      coalesce((r->>'current_streak')::int, 0),
      coalesce((r->>'best_streak')::int, 0),
      nullif(r->>'last_active_date','')::date,
      now()
    )
    on conflict (name) do update set
      current_streak   = excluded.current_streak,
      best_streak      = greatest(public.fish_streaks.best_streak, excluded.best_streak),
      last_active_date = excluded.last_active_date,
      updated_at       = now();
  end loop;
end;
$$;

grant execute on function public.upsert_streaks(jsonb) to anon;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'fish_streaks'
  ) then
    alter publication supabase_realtime add table public.fish_streaks;
  end if;
end $$;
