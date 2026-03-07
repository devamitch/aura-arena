-- ═══════════════════════════════════════════════════════════════════════════════
-- AURA ARENA — Complete Supabase Database Schema v2
-- Run in Supabase SQL Editor → New Query → Run All
-- Tables: profiles, session_history, battle_history, notifications,
--         pose_frames, training_samples, leaderboard_cache, reels,
--         daily_plans, analytics_events
-- ═══════════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for text search on display_name

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
  -- Discipline & training preferences
  discipline           text default 'boxing',
  sub_discipline       text,
  experience_level     text default 'beginner',
  goals                text[] default '{}',
  training_frequency   integer default 3,
  ai_coach_name        text default 'Aria',
  -- Progression
  xp                   integer default 0,
  total_points         integer default 0,
  tier                 text default 'beginner',
  sessions_completed   integer default 0,
  average_score        integer default 0,
  best_score           integer default 0,
  -- Battle stats
  pve_wins             integer default 0,
  pve_losses           integer default 0,
  win_streak           integer default 0,
  best_streak          integer default 0,
  -- Streak
  daily_streak         integer default 0,
  streak_freeze_count  integer default 0,
  last_active_date     text,
  -- Onboarding & premium
  onboarding_complete  boolean default false,
  is_premium           boolean default false,
  -- Timestamps
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Auto-create profile row when user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (
    id, email, display_name, avatar_url, onboarding_complete
  ) values (
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
  grade            text,               -- S/A/B/C/D/F
  ai_feedback      jsonb default '{}', -- Gemini coaching response
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

-- ─── notifications ───────────────────────────────────────────────────────────
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

-- ─── pose_frames (raw pose data per session second → TF training source) ─────
-- Captures MediaPipe landmarks for every session frame (sampled to 1/sec).
-- Used to build TensorFlow training datasets — Gemini labels each second.
create table if not exists public.pose_frames (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade,
  session_id      uuid,                         -- FK to session_history
  discipline      text not null,
  sub_discipline  text,
  frame_second    integer not null,             -- second within session (0-based)
  landmarks       jsonb not null,               -- [{ x, y, z, visibility }] × 33 MediaPipe pose points
  hand_landmarks  jsonb,                        -- left/right hand landmarks (optional)
  frame_score     integer,                      -- overall score for this second
  label           text,                         -- Gemini-assigned action label (e.g. "jab", "warrior_1")
  is_correct      boolean,                      -- correctness determination
  issues          text[] default '{}',          -- detected form issues
  gemini_feedback text,                         -- raw Gemini text for this second
  created_at      timestamptz default now()
);
create index if not exists idx_pf_user     on public.pose_frames(user_id, created_at desc);
create index if not exists idx_pf_disc     on public.pose_frames(discipline, label);
create index if not exists idx_pf_session  on public.pose_frames(session_id, frame_second);

-- ─── training_samples (normalised landmark samples for TF model fine-tuning) ─
-- Each row is one normalised keypoint vector + label, ready to train/fine-tune.
create table if not exists public.training_samples (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete cascade,
  discipline      text not null,
  label           text not null,                -- action class label
  keypoints       float4[] not null,            -- flattened [x,y,z,vis] × 33 = 132 floats
  score           integer,
  is_correct      boolean,
  source          text default 'live',          -- 'live' | 'video' | 'manual'
  created_at      timestamptz default now()
);
create index if not exists idx_ts_disc  on public.training_samples(discipline, label);
create index if not exists idx_ts_user  on public.training_samples(user_id);
-- Allow fast nearest-neighbour lookup by discipline+label for on-device fallback
create index if not exists idx_ts_label on public.training_samples(label, is_correct);

-- ─── leaderboard_cache (materialised every 5 min via Edge Function / cron) ───
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

-- ─── reels (shareable session recordings) ────────────────────────────────────
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
create index if not exists idx_reels_disc    on public.reels(discipline, created_at desc);
create index if not exists idx_reels_user    on public.reels(user_id, created_at desc);
create index if not exists idx_reels_likes   on public.reels(likes desc);

-- ─── reel_likes ──────────────────────────────────────────────────────────────
create table if not exists public.reel_likes (
  reel_id    uuid references public.reels(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (reel_id, user_id)
);

-- ─── reel_comments ───────────────────────────────────────────────────────────
create table if not exists public.reel_comments (
  id           uuid primary key default uuid_generate_v4(),
  reel_id      uuid references public.reels(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete cascade,
  display_name text,
  avatar_url   text,
  text         text not null,
  created_at   timestamptz default now()
);
create index if not exists idx_rc_reel on public.reel_comments(reel_id, created_at);

-- ─── daily_plans (AI-generated per-user daily training plans) ────────────────
create table if not exists public.daily_plans (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade,
  plan_date    date not null,
  discipline   text,
  greeting     text,
  focus_area   text,
  tasks        jsonb default '[]',   -- [{title, type, duration, targetScore}]
  ai_source    text default 'gemini', -- 'gemini' | 'on-device' | 'static'
  completed    boolean default false,
  created_at   timestamptz default now(),
  unique (user_id, plan_date)
);
create index if not exists idx_dp_user on public.daily_plans(user_id, plan_date desc);

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

  -- Auto-tier based on XP
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

-- ─── RPC: upsert_leaderboard ─────────────────────────────────────────────────
create or replace function public.refresh_leaderboard(p_discipline text default 'all')
returns void language plpgsql security definer as $$
begin
  delete from public.leaderboard_cache where discipline = p_discipline;
  insert into public.leaderboard_cache (user_id, discipline, rank, display_name, arena_name, avatar_url, xp, tier, best_score, pve_wins)
  select
    id,
    p_discipline,
    row_number() over (order by xp desc) as rank,
    display_name,
    arena_name,
    avatar_url,
    xp,
    tier,
    best_score,
    pve_wins
  from public.profiles
  where onboarding_complete = true
  order by xp desc
  limit 200;
end;
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.session_history    enable row level security;
alter table public.battle_history     enable row level security;
alter table public.notifications      enable row level security;
alter table public.pose_frames        enable row level security;
alter table public.training_samples   enable row level security;
alter table public.leaderboard_cache  enable row level security;
alter table public.reels              enable row level security;
alter table public.reel_likes         enable row level security;
alter table public.reel_comments      enable row level security;
alter table public.daily_plans        enable row level security;

-- profiles: anyone can read, only owner can write
create policy "profiles_read_all"  on public.profiles for select using (true);
create policy "profiles_insert"    on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update"    on public.profiles for update using (auth.uid() = id);

-- sessions
create policy "sessions_own"   on public.session_history  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "battles_own"    on public.battle_history   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notif_own"      on public.notifications    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- pose frames + training samples: own data only
create policy "pf_own"         on public.pose_frames       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ts_own_write"   on public.training_samples  for insert with check (auth.uid() = user_id);
-- Allow reading ALL training_samples (for community model improvement)
create policy "ts_read_all"    on public.training_samples  for select using (true);

-- leaderboard: public read, system-only write
create policy "lb_read"        on public.leaderboard_cache for select using (true);

-- reels: public read for public reels
create policy "reels_read"     on public.reels for select using (is_public = true or auth.uid() = user_id);
create policy "reels_write"    on public.reels for insert with check (auth.uid() = user_id);
create policy "reels_update"   on public.reels for update using (auth.uid() = user_id);
create policy "reels_delete"   on public.reels for delete using (auth.uid() = user_id);

create policy "likes_read"     on public.reel_likes for select using (true);
create policy "likes_write"    on public.reel_likes for insert with check (auth.uid() = user_id);
create policy "likes_delete"   on public.reel_likes for delete using (auth.uid() = user_id);

create policy "comments_read"  on public.reel_comments for select using (true);
create policy "comments_write" on public.reel_comments for insert with check (auth.uid() = user_id);
create policy "comments_delete"on public.reel_comments for delete using (auth.uid() = user_id);

create policy "dp_own"         on public.daily_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── analytics_events ────────────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz default now(),
  event       text not null,
  user_id     text,
  session_id  text not null,
  properties  jsonb default '{}'
);
create index if not exists ae_event_idx   on public.analytics_events (event);
create index if not exists ae_user_idx    on public.analytics_events (user_id);
create index if not exists ae_created_idx on public.analytics_events (created_at desc);
create index if not exists ae_session_idx on public.analytics_events (session_id);

alter table public.analytics_events enable row level security;
create policy "analytics_insert_anon" on public.analytics_events for insert to anon, authenticated with check (true);
create policy "analytics_select_own"  on public.analytics_events for select to authenticated using (user_id = auth.uid()::text);

-- ─── Views ───────────────────────────────────────────────────────────────────
create or replace view public.analytics_summary as
select event, count(*) as total, count(distinct user_id) as unique_users,
       count(distinct session_id) as sessions, max(created_at) as last_seen
from public.analytics_events group by event order by total desc;

create or replace view public.analytics_daily as
select date_trunc('day', created_at at time zone 'UTC') as day, event,
       count(*) as events, count(distinct user_id) as users
from public.analytics_events
where created_at > now() - interval '30 days'
group by 1, 2 order by 1 desc, 3 desc;

-- ─── User progress view (for profile pages) ──────────────────────────────────
create or replace view public.user_progress as
select
  p.id,
  p.display_name,
  p.discipline,
  p.xp,
  p.tier,
  p.sessions_completed,
  p.best_score,
  p.pve_wins,
  p.daily_streak,
  count(distinct sh.id) as total_sessions,
  avg(sh.score)::integer as avg_score_real,
  max(sh.score) as max_score_real,
  count(distinct date_trunc('day', sh.created_at)) as active_days
from public.profiles p
left join public.session_history sh on sh.user_id = p.id
group by p.id;
