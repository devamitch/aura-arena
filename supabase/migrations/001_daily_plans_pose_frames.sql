-- ═══════════════════════════════════════════════════════════════════════════════
-- AURA ARENA — Supabase Migration: Daily Plans, Pose Frames, Weekly Goals
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── DAILY PLANS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_plans (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  discipline    TEXT NOT NULL,
  sub_discipline TEXT,
  plan_data     JSONB NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own plans"   ON daily_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plans" ON daily_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plans" ON daily_plans FOR UPDATE USING (auth.uid() = user_id);

-- ─── POSE FRAME HISTORY ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pose_frames (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id    TEXT NOT NULL,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frame_index   INT NOT NULL,
  timestamp_ms  FLOAT NOT NULL,
  keypoints     JSONB NOT NULL,
  score         FLOAT NOT NULL,
  accuracy      FLOAT NOT NULL,
  stability     FLOAT NOT NULL,
  action_label  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pose_frames_session ON pose_frames(session_id);
CREATE INDEX IF NOT EXISTS idx_pose_frames_user    ON pose_frames(user_id);

ALTER TABLE pose_frames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own frames"   ON pose_frames FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own frames" ON pose_frames FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── WEEKLY GOALS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weekly_goals (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,
  goals         JSONB NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own goals"   ON weekly_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own goals" ON weekly_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own goals" ON weekly_goals FOR UPDATE USING (auth.uid() = user_id);

-- ─── TRAINING SAMPLES (if not exists) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_samples (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keypoints     JSONB NOT NULL,
  gemini_label  TEXT,
  gemini_score  FLOAT,
  discipline    TEXT NOT NULL,
  issues        JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE training_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own samples"   ON training_samples FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own samples" ON training_samples FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone reads for training" ON training_samples FOR SELECT USING (true);

-- ─── GEMINI ANALYSES (if not exists) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gemini_analyses (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id      TEXT,
  analysis      JSONB NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gemini_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own analyses"   ON gemini_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own analyses" ON gemini_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── ADD sub_discipline + video_url TO REELS (if missing) ────────────────────

DO $$ BEGIN
  ALTER TABLE reels ADD COLUMN IF NOT EXISTS sub_discipline TEXT;
  ALTER TABLE reels ADD COLUMN IF NOT EXISTS video_url TEXT;
  ALTER TABLE reels ADD COLUMN IF NOT EXISTS session_id TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;
