-- Wildsea Character Sheet Database Schema
-- Run this in Supabase SQL Editor

-- Sessions table (represents a crew/game group)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  active_character_id UUID,
  active_ship_id UUID,
  active_view TEXT DEFAULT 'character' CHECK (active_view IN ('character', 'ship'))
);

-- Characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Unnamed Character',
  mode TEXT NOT NULL DEFAULT 'creation' CHECK (mode IN ('creation', 'play', 'advancement')),
  bloodline TEXT,
  origin TEXT,
  post TEXT,
  selected_aspects JSONB DEFAULT '[]'::jsonb,
  selected_edges JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '{}'::jsonb,
  languages JSONB DEFAULT '{}'::jsonb,
  drives JSONB DEFAULT '[]'::jsonb,
  mires JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ships table
CREATE TABLE ships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Ship',
  mode TEXT NOT NULL DEFAULT 'creation' CHECK (mode IN ('creation', 'play', 'upgrade')),
  anticipated_crew_size INTEGER DEFAULT 3,
  additional_stakes INTEGER DEFAULT 0,
  rating_damage JSONB DEFAULT '{}'::jsonb,
  size JSONB,
  frame JSONB,
  hull JSONB DEFAULT '[]'::jsonb,
  bite JSONB DEFAULT '[]'::jsonb,
  engine JSONB DEFAULT '[]'::jsonb,
  motifs JSONB DEFAULT '[]'::jsonb,
  general_additions JSONB DEFAULT '[]'::jsonb,
  bounteous_additions JSONB DEFAULT '[]'::jsonb,
  rooms JSONB DEFAULT '[]'::jsonb,
  armaments JSONB DEFAULT '[]'::jsonb,
  undercrew JSONB DEFAULT '{}'::jsonb,
  undercrew_damage JSONB DEFAULT '{}'::jsonb,
  cargo JSONB DEFAULT '[]'::jsonb,
  passengers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for session-character relationships
CREATE TABLE session_characters (
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, character_id)
);

-- Create indexes for performance
CREATE INDEX idx_characters_session_id ON characters(session_id);
CREATE INDEX idx_ships_session_id ON ships(session_id);
CREATE INDEX idx_session_characters_session ON session_characters(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_characters ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll add authentication later)
CREATE POLICY "Allow all operations" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON characters FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON ships FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON session_characters FOR ALL USING (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE characters;
ALTER PUBLICATION supabase_realtime ADD TABLE ships;
ALTER PUBLICATION supabase_realtime ADD TABLE session_characters;
