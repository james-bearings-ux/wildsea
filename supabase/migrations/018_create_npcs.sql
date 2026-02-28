-- Create NPCs table for Notion-synced NPC data
CREATE TABLE npcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  description text,
  status text DEFAULT 'unknown',     -- alive | dead | missing | unknown
  faction text,
  first_seen text,                   -- date string of earliest session appearance
  last_seen text,                    -- date string of most recent session appearance
  revealed boolean DEFAULT false,    -- false = DM only, true = visible to players
  source_page_ids text[] DEFAULT '{}', -- notion page IDs this NPC was extracted from
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Case-insensitive unique index on name for deduplication
CREATE UNIQUE INDEX npcs_name_lower_idx ON npcs (lower(name));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_npcs_updated_at
  BEFORE UPDATE ON npcs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: players see only revealed NPCs, DMs see all
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players see revealed NPCs"
  ON npcs FOR SELECT
  USING (
    revealed = true
    OR EXISTS (
      SELECT 1 FROM email_whitelist
      WHERE email = auth.jwt()->>'email'
      AND role = 'dm'
    )
  );

CREATE POLICY "DMs can insert NPCs"
  ON npcs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_whitelist
      WHERE email = auth.jwt()->>'email'
      AND role = 'dm'
    )
  );

CREATE POLICY "DMs can update NPCs"
  ON npcs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM email_whitelist
      WHERE email = auth.jwt()->>'email'
      AND role = 'dm'
    )
  );
