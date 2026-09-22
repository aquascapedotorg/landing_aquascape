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

-- Drop-then-create so this script is safe to re-run (create policy has no IF NOT EXISTS).
drop policy if exists "Allow public read access" on public.fish_daily_kuaci;
create policy "Allow public read access"
  on public.fish_daily_kuaci for select using (true);

drop policy if exists "Allow public insert access" on public.fish_daily_kuaci;
create policy "Allow public insert access"
  on public.fish_daily_kuaci for insert with check (true);

drop policy if exists "Allow public update access" on public.fish_daily_kuaci;
create policy "Allow public update access"
  on public.fish_daily_kuaci for update using (true) with check (true);

-- Atomic increment: avoids lost updates when multiple visitors feed the same fish.
create or replace function public.increment_kuaci(p_name text, p_amount int)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.fish_daily_kuaci (name, entry_date, kuaci_count, updated_at)
  values (p_name, current_date, greatest(p_amount, 0), now())
  on conflict (name, entry_date)
  do update set
    kuaci_count = public.fish_daily_kuaci.kuaci_count + greatest(excluded.kuaci_count, 0),
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

drop policy if exists "Allow public read access" on public.fish_streaks;
create policy "Allow public read access"
  on public.fish_streaks for select using (true);
drop policy if exists "Allow public insert access" on public.fish_streaks;
create policy "Allow public insert access"
  on public.fish_streaks for insert with check (true);
drop policy if exists "Allow public update access" on public.fish_streaks;
create policy "Allow public update access"
  on public.fish_streaks for update using (true) with check (true);

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
