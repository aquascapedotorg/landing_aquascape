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

create policy "Allow public read access"
  on public.fish_daily_kuaci for select using (true);

create policy "Allow public insert access"
  on public.fish_daily_kuaci for insert with check (true);

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

-- Live leaderboard updates
alter publication supabase_realtime add table public.fish_daily_kuaci;
