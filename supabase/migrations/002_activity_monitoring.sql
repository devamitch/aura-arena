-- ═══════════════════════════════════════════════════════════════════════════════
-- AURA ARENA — Migration 002: Activity Monitoring & Notifications
-- Tables: user_actions, session_summaries, push_subscriptions
-- All with RLS enabled.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── User Actions (every in-game interaction) ────────────────────────────────

CREATE TABLE IF NOT EXISTS user_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type   TEXT NOT NULL,
  timestamp_ms  BIGINT NOT NULL,
  data          JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_actions_session ON user_actions(session_id);
CREATE INDEX idx_user_actions_user ON user_actions(user_id, created_at DESC);

ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own actions" ON user_actions
  FOR ALL USING (auth.uid() = user_id);

-- ─── Session Summaries (aggregated per-session stats) ────────────────────────

CREATE TABLE IF NOT EXISTS session_summaries (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline        TEXT NOT NULL,
  sub_discipline    TEXT,
  start_time        TIMESTAMPTZ NOT NULL,
  end_time          TIMESTAMPTZ,
  total_duration_s  REAL DEFAULT 0,
  pose_frame_count  INT DEFAULT 0,
  action_count      INT DEFAULT 0,
  avg_accuracy      INT DEFAULT 0,
  avg_stability     INT DEFAULT 0,
  peak_score        INT DEFAULT 0,
  avg_score         INT DEFAULT 0,
  max_combo         INT DEFAULT 0,
  score_timeline    JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_session_summaries_user ON session_summaries(user_id, start_time DESC);
CREATE INDEX idx_session_summaries_discipline ON session_summaries(discipline, start_time DESC);

ALTER TABLE session_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own sessions" ON session_summaries
  FOR ALL USING (auth.uid() = user_id);

-- ─── Push Subscriptions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  keys        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subs" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ─── Useful RPC: increment XP ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_xp(p_user_id UUID, p_amount INT)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET xp = COALESCE(xp, 0) + p_amount WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Useful RPC: refresh leaderboard ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_leaderboard(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Update rank based on total XP
  UPDATE profiles SET rank = sub.rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY xp DESC) as rank
    FROM profiles
  ) sub
  WHERE profiles.id = sub.id AND profiles.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
