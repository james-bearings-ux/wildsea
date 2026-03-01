-- Add DELETE policy for NPCs table (omitted from original migration)
-- DMs can delete NPCs from the app

CREATE POLICY "DMs can delete NPCs"
  ON npcs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM email_whitelist
      WHERE email = auth.jwt()->>'email'
      AND role = 'dm'
    )
  );
