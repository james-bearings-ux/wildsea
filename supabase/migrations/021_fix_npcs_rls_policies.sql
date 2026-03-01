-- Fix NPC RLS policies to use get_user_role() instead of a raw EXISTS subquery.
--
-- The original policies queried email_whitelist directly, which fails because:
--   1. email_whitelist has its own RLS that blocks unauthenticated subqueries
--   2. The comparison used case-sensitive = instead of LOWER()
--
-- get_user_role() is SECURITY DEFINER and handles case-insensitive matching,
-- matching the pattern used by all other role checks in the app.

DROP POLICY IF EXISTS "Players see revealed NPCs" ON npcs;
DROP POLICY IF EXISTS "DMs can insert NPCs" ON npcs;
DROP POLICY IF EXISTS "DMs can update NPCs" ON npcs;
DROP POLICY IF EXISTS "DMs can delete NPCs" ON npcs;

CREATE POLICY "Players see revealed NPCs"
  ON npcs FOR SELECT
  USING (
    revealed = true
    OR get_user_role(auth.email()) = 'dm'
  );

CREATE POLICY "DMs can insert NPCs"
  ON npcs FOR INSERT
  WITH CHECK (get_user_role(auth.email()) = 'dm');

CREATE POLICY "DMs can update NPCs"
  ON npcs FOR UPDATE
  USING (get_user_role(auth.email()) = 'dm');

CREATE POLICY "DMs can delete NPCs"
  ON npcs FOR DELETE
  USING (get_user_role(auth.email()) = 'dm');
