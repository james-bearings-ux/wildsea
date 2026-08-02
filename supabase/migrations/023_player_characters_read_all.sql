-- Let any authenticated user READ the player↔character mapping.
--
-- Phase 2 shipped the mapping as DM-only (022), so online-pinning on the DM/Data
-- screen only worked for the DM. The Data screen is visible to players too, and the
-- pinning (who's online) is useful for everyone — including a player seeing their own
-- character pinned. The mapping is low-sensitivity (presence + character names are
-- already visible to all in the session), so we open SELECT to any logged-in user.
--
-- Writes (INSERT/UPDATE/DELETE) stay DM-only — the Players tab is unchanged.

DROP POLICY IF EXISTS "DMs can read player_characters" ON public.player_characters;

CREATE POLICY "Authenticated can read player_characters"
  ON public.player_characters FOR SELECT
  USING (auth.uid() IS NOT NULL);
