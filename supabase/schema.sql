-- ═══════════════════════════════════════════════════════════════════════════════
-- AURA ARENA — Complete Supabase Schema
-- Run in your Supabase project SQL editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id                    UUID REFERENCES auth.users PRIMARY KEY,
  email                 TEXT,
  display_name          TEXT,
  username              TEXT UNIQUE,
  arena_name            TEXT,
  avatar_url            TEXT,
  bio                   TEXT DEFAULT '',
  country               TEXT DEFAULT '',
  discipline            TEXT DEFAULT 'boxing',
  sub_discipline_id     TEXT,
  experience_level      TEXT DEFAULT 'beginner',
  goals                 TEXT[] DEFAULT '{}',
  training_frequency    INTEGER DEFAULT 3,
  session_duration      INTEGER DEFAULT 30,
  tier                  TEXT DEFAULT 'bronze',
  xp                    INTEGER DEFAULT 0,
  total_points          INTEGER DEFAULT 0,
  average_score         NUMERIC DEFAULT 0,
  sessions_completed    INTEGER DEFAULT 0,
  pve_wins              INTEGER DEFAULT 0,
  pve_losses            INTEGER DEFAULT 0,
  win_streak            INTEGER DEFAULT 0,
  best_streak           INTEGER DEFAULT 0,
  best_score            NUMERIC DEFAULT 0,
  daily_streak          INTEGER DEFAULT 0,
  streak_freeze_count   INTEGER DEFAULT 0,
  last_active_date      DATE,
  onboarding_complete   BOOLEAN DEFAULT FALSE,
  subscription_tier     TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id    TEXT,
  sound_enabled         BOOLEAN DEFAULT FALSE,
  reduce_motion         BOOLEAN DEFAULT FALSE,
  master_volume         NUMERIC DEFAULT 0.8,
  haptics_enabled       BOOLEAN DEFAULT TRUE,
  mirror_camera         BOOLEAN DEFAULT TRUE,
  theme                 TEXT DEFAULT 'dark',
  push_notifications    BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE,
  discipline        TEXT NOT NULL,
  sub_discipline_id TEXT,
  drill_id          TEXT NOT NULL,
  drill_name        TEXT,
  difficulty        INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  score             NUMERIC NOT NULL,
  accuracy          NUMERIC DEFAULT 0,
  stability         NUMERIC DEFAULT 0,
  timing            NUMERIC DEFAULT 0,
  expressiveness    NUMERIC DEFAULT 0,
  power             NUMERIC DEFAULT 0,
  balance           NUMERIC DEFAULT 0,
  duration          INTEGER NOT NULL, -- seconds
  best_combo        INTEGER DEFAULT 0,
  xp_earned         INTEGER DEFAULT 0,
  points_earned     INTEGER DEFAULT 0,
  coaching_text     TEXT DEFAULT '',
  is_personal_best  BOOLEAN DEFAULT FALSE,
  synced_offline    BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Reels ────────────────────────────────────────────────────────────────────
CREATE TABLE reels (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id       UUID REFERENCES sessions(id) ON DELETE SET NULL,
  discipline       TEXT NOT NULL,
  sub_discipline   TEXT,
  drill_name       TEXT NOT NULL,
  score            NUMERIC NOT NULL,
  accuracy         NUMERIC DEFAULT 0,
  stability        NUMERIC DEFAULT 0,
  timing           NUMERIC DEFAULT 0,
  caption          TEXT DEFAULT '',
  is_public        BOOLEAN DEFAULT TRUE,
  likes_count      INTEGER DEFAULT 0,
  comments_count   INTEGER DEFAULT 0,
  shares_count     INTEGER DEFAULT 0,
  visibility_score INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Reel Likes ──────────────────────────────────────────────────────────────
CREATE TABLE reel_likes (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reel_id    UUID REFERENCES reels(id)    ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, reel_id)
);

-- ─── Reel Comments ───────────────────────────────────────────────────────────
CREATE TABLE reel_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id     UUID REFERENCES reels(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Daily Missions ───────────────────────────────────────────────────────────
CREATE TABLE daily_missions (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mission_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  icon          TEXT,
  name          TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL,
  target        INTEGER NOT NULL,
  current       INTEGER DEFAULT 0,
  reward        INTEGER NOT NULL,
  complete      BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, mission_date, type)
);

-- ─── Weekly Challenges ────────────────────────────────────────────────────────
CREATE TABLE weekly_challenges (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  icon        TEXT,
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL,
  target      INTEGER NOT NULL,
  current     INTEGER DEFAULT 0,
  reward      INTEGER NOT NULL,
  complete    BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, week_start, type)
);

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB DEFAULT '{}',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Battles ─────────────────────────────────────────────────────────────────
CREATE TABLE battles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_1_id     UUID REFERENCES profiles(id),
  player_2_id     UUID REFERENCES profiles(id),
  discipline      TEXT NOT NULL,
  drill_id        TEXT,
  player_1_score  NUMERIC DEFAULT 0,
  player_2_score  NUMERIC DEFAULT 0,
  winner_id       UUID REFERENCES profiles(id),
  xp_awarded      INTEGER DEFAULT 0,
  points_awarded  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'pending', -- pending|active|complete
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Imported Sessions ────────────────────────────────────────────────────────
CREATE TABLE imported_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source_app         TEXT NOT NULL,
  activity_date      DATE NOT NULL,
  activity_type      TEXT,
  discipline_mapped  TEXT,
  duration_minutes   INTEGER,
  performance_data   JSONB DEFAULT '{}',
  imported_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Leaderboard View ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
  ROW_NUMBER() OVER (ORDER BY total_points DESC) AS rank,
  id         AS user_id,
  display_name,
  username,
  avatar_url,
  discipline,
  tier,
  total_points,
  country,
  daily_streak
FROM profiles
WHERE onboarding_complete = TRUE
ORDER BY total_points DESC;

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_sessions  ENABLE ROW LEVEL SECURITY;

-- Profiles: users own their data, all can read public fields
CREATE POLICY "profile_select_own"     ON profiles FOR SELECT USING (true);
CREATE POLICY "profile_update_own"     ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profile_insert_own"     ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Sessions: private
CREATE POLICY "sessions_own"  ON sessions  FOR ALL USING (auth.uid() = user_id);

-- Reels: public readable, own writable
CREATE POLICY "reels_select_public"    ON reels FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);
CREATE POLICY "reels_insert_own"       ON reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reels_update_own"       ON reels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reels_delete_own"       ON reels FOR DELETE USING (auth.uid() = user_id);

-- Likes: any auth user can like, own readable
CREATE POLICY "likes_select_all"       ON reel_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "likes_insert_own"       ON reel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own"       ON reel_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, own write
CREATE POLICY "comments_select_all"    ON reel_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own"    ON reel_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own"    ON reel_comments FOR DELETE USING (auth.uid() = user_id);

-- Missions / Challenges / Notifications: private
CREATE POLICY "missions_own"           ON daily_missions    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "challenges_own"         ON weekly_challenges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifications_own"      ON notifications     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "battles_participant"    ON battles           FOR ALL USING (auth.uid() = player_1_id OR auth.uid() = player_2_id);
CREATE POLICY "imports_own"            ON imported_sessions FOR ALL USING (auth.uid() = user_id);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE reels;
ALTER PUBLICATION supabase_realtime ADD TABLE reel_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE battles;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_sessions_user_id      ON sessions (user_id, created_at DESC);
CREATE INDEX idx_reels_discipline      ON reels (discipline, created_at DESC);
CREATE INDEX idx_reels_user_id         ON reels (user_id);
CREATE INDEX idx_reel_likes_reel_id    ON reel_likes (reel_id);
CREATE INDEX idx_notifications_user    ON notifications (user_id, created_at DESC);
CREATE INDEX idx_battles_players       ON battles (player_1_id, player_2_id);
CREATE INDEX idx_leaderboard_points    ON profiles (total_points DESC);

-- ─── Triggers ─────────────────────────────────────────────────────────────────
-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Arena Athlete')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update reel likes_count on like/unlike
CREATE OR REPLACE FUNCTION update_reel_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reels SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.reel_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reel_likes_count_trigger
  AFTER INSERT OR DELETE ON reel_likes
  FOR EACH ROW EXECUTE FUNCTION update_reel_likes_count();
