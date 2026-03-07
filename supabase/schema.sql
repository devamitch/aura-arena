-- ═══════════════════════════════════════════════════════════════════════════════
-- AURA ARENA — Supabase Database Schema
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New Query → Run)
-- ═══════════════════════════════════════════════════════════════════════════════
create extension if not exists "uuid-ossp";

-- profiles ─────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  display_name       text,
  arena_name         text,
  avatar_url         text,
  discipline         text default 'boxing',
  ai_coach_name      text default 'Aria',
  xp                 integer default 0,
  tier               text default 'beginner',
  sessions_completed integer default 0,
  pve_wins           integer default 0,
  best_score         integer default 0,
  win_streak         integer default 0,
  daily_streak       integer default 0,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- session_history ──────────────────────────────────────────────────────────────
create table if not exists public.session_history (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references public.profiles(id) on delete cascade,
  discipline       text not null,
  difficulty       smallint default 3,
  score            integer default 0,
  accuracy         integer default 0,
  combo            integer default 0,
  duration_seconds integer default 0,
  xp_gained        integer default 0,
  drill_name       text,
  created_at       timestamptz default now()
);
create index if not exists idx_session_user on public.session_history(user_id, created_at desc);

-- battle_history ───────────────────────────────────────────────────────────────
create table if not exists public.battle_history (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles(id) on delete cascade,
  opponent_id       uuid references public.profiles(id) on delete set null,
  opponent_name     text not null,
  discipline        text not null,
  my_score          integer default 0,
  opp_score         integer default 0,
  won               boolean default false,
  xp_gained         integer default 0,
  is_real_opponent  boolean default false,
  created_at        timestamptz default now()
);
create index if not exists idx_battle_user on public.battle_history(user_id, created_at desc);

-- notifications ────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  message    text,
  data       jsonb default '{}',
  is_read    boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_notif_user on public.notifications(user_id, is_read, created_at desc);

-- increment_user_stats RPC ─────────────────────────────────────────────────────
create or replace function public.increment_user_stats(
  p_user_id uuid, p_xp integer default 0, p_sessions integer default 0,
  p_best_score integer default 0, p_pve_wins integer default 0
) returns void language plpgsql security definer as $$
declare v_new_xp integer;
begin
  update public.profiles set
    xp = xp + p_xp, sessions_completed = sessions_completed + p_sessions,
    best_score = greatest(best_score, p_best_score), pve_wins = pve_wins + p_pve_wins,
    updated_at = now()
  where id = p_user_id returning xp into v_new_xp;
  update public.profiles set tier = case
    when v_new_xp >= 100000 then 'legend' when v_new_xp >= 50000 then 'elite'
    when v_new_xp >= 20000 then 'champ'   when v_new_xp >= 8000  then 'plat'
    when v_new_xp >= 3000  then 'gold'    when v_new_xp >= 1000  then 'silver'
    when v_new_xp >= 300   then 'bronze'  else 'beginner' end
  where id = p_user_id;
end;
$$;

-- RLS ──────────────────────────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.session_history enable row level security;
alter table public.battle_history  enable row level security;
alter table public.notifications   enable row level security;

create policy "profiles_read_all"  on public.profiles for select using (true);
create policy "profiles_insert"    on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update"    on public.profiles for update using (auth.uid() = id);
create policy "sessions_own"       on public.session_history using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "battles_own"        on public.battle_history  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_own"  on public.notifications   using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── analytics_events (Supabase-native analytics) ───────────────────────────
-- Replaces PostHog. All game events are stored here for free, with full SQL access.
-- Query examples:
--   SELECT event, count(*) FROM analytics_events GROUP BY event ORDER BY count DESC;
--   SELECT date_trunc('day', created_at), count(*) FROM analytics_events WHERE event='session_started' GROUP BY 1;

create table if not exists public.analytics_events (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz default now(),
  event       text not null,
  user_id     text,
  session_id  text not null,
  properties  jsonb default '{}'
);

-- Fast query indexes
create index if not exists ae_event_idx      on public.analytics_events (event);
create index if not exists ae_user_idx       on public.analytics_events (user_id);
create index if not exists ae_created_idx    on public.analytics_events (created_at desc);
create index if not exists ae_session_idx    on public.analytics_events (session_id);

-- RLS: anyone (including anon) can INSERT; authenticated users can SELECT their own
alter table public.analytics_events enable row level security;

create policy "analytics_insert_anon"
  on public.analytics_events for insert
  to anon, authenticated
  with check (true);

create policy "analytics_select_own"
  on public.analytics_events for select
  to authenticated
  using (user_id = auth.uid()::text);

-- ─── Useful analytics views ─────────────────────────────────────────────────
create or replace view public.analytics_summary as
select
  event,
  count(*) as total,
  count(distinct user_id) as unique_users,
  count(distinct session_id) as sessions,
  max(created_at) as last_seen
from public.analytics_events
group by event
order by total desc;

create or replace view public.analytics_daily as
select
  date_trunc('day', created_at at time zone 'UTC') as day,
  event,
  count(*) as events,
  count(distinct user_id) as users
from public.analytics_events
where created_at > now() - interval '30 days'
group by 1, 2
order by 1 desc, 3 desc;
