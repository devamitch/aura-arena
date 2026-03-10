-- ═══════════════════════════════════════════════════════════════════════════════
-- AURA ARENA — Run this in Supabase SQL Editor
-- Dashboard → https://supabase.com/dashboard/project/wuxfgmpwanictdaaypmq/sql/new
-- Paste the ENTIRE file and click "Run"
-- Safe to run multiple times (uses CREATE IF NOT EXISTS / OR REPLACE)
-- ═══════════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text,
  display_name         text,
  arena_name           text,
  username             text unique,
  avatar_url           text,
  bio                  text default '',
  country              text default 'UN',
  discipline           text default 'boxing',
  sub_discipline       text,
  experience_level     text default 'beginner',
  goals                text[] default '{}',
  training_frequency   integer default 3,
  ai_coach_name        text default 'Aria',
  xp                   integer default 0,
  total_points         integer default 0,
  tier                 text default 'beginner',
  sessions_completed   integer default 0,
  average_score        integer default 0,
  best_score           integer default 0,
  pve_wins             integer default 0,
  pve_losses           integer default 0,
  win_streak           integer default 0,
  best_streak          integer default 0,
  daily_streak         integer default 0,
  streak_freeze_count  integer default 0,
  last_active_date     text,
  onboarding_complete  boolean default false,
  is_premium           boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, onboarding_complete)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    false
  ) on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── session_history ─────────────────────────────────────────────────────────
create table if not exists public.session_history (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references public.profiles(id) on delete cascade,
  discipline       text not null,
  sub_discipline   text,
  difficulty       smallint default 3,
  score            integer default 0,
  accuracy         integer default 0,
  timing           integer default 0,
  power            integer default 0,
  stability        integer default 0,
  expressiveness   integer default 0,
  balance          integer default 0,
  combo            integer default 0,
  peak_score       integer default 0,
  total_frames     integer default 0,
  duration_seconds integer default 0,
  xp_gained        integer default 0,
  drill_name       text,
  grade            text,
  ai_feedback      jsonb default '{}',
  created_at       timestamptz default now()
);
create index if not exists idx_session_user on public.session_history(user_id, created_at desc);
create index if not exists idx_session_disc on public.session_history(discipline, score desc);

-- ─── battle_history ──────────────────────────────────────────────────────────
create table if not exists public.battle_history (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references public.profiles(id) on delete cascade,
  opponent_id      uuid references public.profiles(id) on delete set null,
  opponent_name    text not null,
  discipline       text not null,
  my_score         integer default 0,
  opp_score        integer default 0,
  won              boolean default false,
  xp_gained        integer default 0,
  is_real_opponent boolean default false,
  created_at       timestamptz default now()
);
create index if not exists idx_battle_user on public.battle_history(user_id, created_at desc);

-- ─── notifications ────────────────────────────────────────────────────────────
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

-- ─── pose_frames ──────────────────────────────────────────────────────────────
create table if not exists public.pose_frames (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade,
  session_id      uuid,
  discipline      text not null,
  sub_discipline  text,
  frame_second    integer not null,
  landmarks       jsonb not null,
  hand_landmarks  jsonb,
  frame_score     integer,
  label           text,
  is_correct      boolean,
  issues          text[] default '{}',
  gemini_feedback text,
  created_at      timestamptz default now()
);
create index if not exists idx_pf_user    on public.pose_frames(user_id, created_at desc);
create index if not exists idx_pf_session on public.pose_frames(session_id, frame_second);

-- ─── leaderboard_cache ───────────────────────────────────────────────────────
create table if not exists public.leaderboard_cache (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade,
  discipline   text not null default 'all',
  rank         integer not null,
  display_name text,
  arena_name   text,
  avatar_url   text,
  xp           integer default 0,
  tier         text,
  best_score   integer default 0,
  pve_wins     integer default 0,
  updated_at   timestamptz default now(),
  unique (user_id, discipline)
);
create index if not exists idx_lb_disc_rank on public.leaderboard_cache(discipline, rank);

-- ─── reels ───────────────────────────────────────────────────────────────────
create table if not exists public.reels (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade,
  title        text,
  description  text,
  discipline   text,
  video_url    text,
  thumbnail    text,
  duration     integer,
  score        integer,
  likes        integer default 0,
  views        integer default 0,
  is_public    boolean default true,
  created_at   timestamptz default now()
);
create index if not exists idx_reels_disc  on public.reels(discipline, created_at desc);
create index if not exists idx_reels_user  on public.reels(user_id, created_at desc);
create index if not exists idx_reels_likes on public.reels(likes desc);

create table if not exists public.reel_likes (
  reel_id    uuid references public.reels(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (reel_id, user_id)
);
create table if not exists public.reel_comments (
  id           uuid primary key default uuid_generate_v4(),
  reel_id      uuid references public.reels(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete cascade,
  display_name text,
  avatar_url   text,
  text         text not null,
  created_at   timestamptz default now()
);

-- ─── daily_plans ─────────────────────────────────────────────────────────────
create table if not exists public.daily_plans (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade,
  plan_date    date not null,
  discipline   text,
  greeting     text,
  focus_area   text,
  tasks        jsonb default '[]',
  ai_source    text default 'gemini',
  completed    boolean default false,
  created_at   timestamptz default now(),
  unique (user_id, plan_date)
);
create index if not exists idx_dp_user on public.daily_plans(user_id, plan_date desc);

-- ─── analytics_events ────────────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz default now(),
  event       text not null,
  user_id     text,
  session_id  text not null,
  properties  jsonb default '{}'
);
create index if not exists ae_event_idx on public.analytics_events(event);
create index if not exists ae_user_idx  on public.analytics_events(user_id);

-- ─── RPC: increment_user_stats ───────────────────────────────────────────────
create or replace function public.increment_user_stats(
  p_user_id    uuid,
  p_xp         integer default 0,
  p_sessions   integer default 0,
  p_best_score integer default 0,
  p_pve_wins   integer default 0
) returns void language plpgsql security definer as $$
declare v_new_xp integer;
begin
  update public.profiles set
    xp                 = xp + p_xp,
    sessions_completed = sessions_completed + p_sessions,
    best_score         = greatest(best_score, p_best_score),
    pve_wins           = pve_wins + p_pve_wins,
    updated_at         = now()
  where id = p_user_id returning xp into v_new_xp;
  update public.profiles set tier = case
    when v_new_xp >= 100000 then 'legend'
    when v_new_xp >= 50000  then 'elite'
    when v_new_xp >= 20000  then 'champ'
    when v_new_xp >= 8000   then 'plat'
    when v_new_xp >= 3000   then 'gold'
    when v_new_xp >= 1000   then 'silver'
    when v_new_xp >= 300    then 'bronze'
    else 'beginner' end
  where id = p_user_id;
end;
$$;

-- ─── RPC: refresh_leaderboard ────────────────────────────────────────────────
create or replace function public.refresh_leaderboard(p_discipline text default 'all')
returns void language plpgsql security definer as $$
begin
  delete from public.leaderboard_cache where discipline = p_discipline;
  insert into public.leaderboard_cache
    (user_id, discipline, rank, display_name, arena_name, avatar_url, xp, tier, best_score, pve_wins)
  select id, p_discipline,
    row_number() over (order by xp desc),
    display_name, arena_name, avatar_url, xp, tier, best_score, pve_wins
  from public.profiles
  where onboarding_complete = true
  order by xp desc limit 200;
end;
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.session_history    enable row level security;
alter table public.battle_history     enable row level security;
alter table public.notifications      enable row level security;
alter table public.pose_frames        enable row level security;
alter table public.leaderboard_cache  enable row level security;
alter table public.reels              enable row level security;
alter table public.reel_likes         enable row level security;
alter table public.reel_comments      enable row level security;
alter table public.daily_plans        enable row level security;
alter table public.analytics_events   enable row level security;

-- Profiles
do $$ begin
  create policy "profiles_read_all" on public.profiles for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Sessions / Battles / Notifications
do $$ begin
  create policy "sessions_own" on public.session_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "battles_own" on public.battle_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "notif_own" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "pf_own" on public.pose_frames for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Leaderboard: public read
do $$ begin
  create policy "lb_read" on public.leaderboard_cache for select using (true);
exception when duplicate_object then null; end $$;

-- Reels
do $$ begin
  create policy "reels_read" on public.reels for select using (is_public = true or auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "reels_write" on public.reels for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "reels_update" on public.reels for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "likes_read" on public.reel_likes for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "likes_write" on public.reel_likes for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "comments_read" on public.reel_comments for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "comments_write" on public.reel_comments for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Daily plans
do $$ begin
  create policy "dp_own" on public.daily_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Analytics: anon insert (for unauthenticated event tracking), no read
do $$ begin
  create policy "ae_insert" on public.analytics_events for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "ae_select_own" on public.analytics_events for select using (user_id = auth.uid()::text or auth.role() = 'service_role');
exception when duplicate_object then null; end $$;
