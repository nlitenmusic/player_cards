-- Creates tables for achievements and awarded player badges

CREATE TABLE IF NOT EXISTS achievements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon_url text,
  rule_type text NOT NULL, -- e.g. 'top_by_skill'
  rule_payload jsonb, -- rule-specific options (e.g. {"skill":"Serve","component":"c","top_n":1})
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_achievements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id bigint NOT NULL,
  achievement_id bigint NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  source text DEFAULT 'system',
  metadata jsonb,
  UNIQUE (player_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS achievement_award_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_achievement_id bigint REFERENCES player_achievements(id) ON DELETE SET NULL,
  action text NOT NULL,
  actor text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for querying awards quickly
CREATE INDEX IF NOT EXISTS idx_player_achievements_player ON player_achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_achievement ON player_achievements(achievement_id);
