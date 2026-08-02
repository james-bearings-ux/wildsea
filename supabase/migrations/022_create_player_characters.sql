-- Associate a player (by login email) with a default character.
--
-- Phase 2 of the DM dashboard: the DM screen sorts characters alphabetically and
-- pins characters controlled by an online player to the top. "Online" is keyed by
-- email (session_presence), so we map email -> character here.
--
-- email_whitelist is service-role-only (see 001), so this mapping lives in its own
-- table with DM-only RLS, mirroring the npcs pattern (see 018 / 021). All access is
-- gated by get_user_role(auth.email()) = 'dm' (SECURITY DEFINER, case-insensitive).

CREATE TABLE IF NOT EXISTS public.player_characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_characters_email ON public.player_characters(email);

ALTER TABLE public.player_characters ENABLE ROW LEVEL SECURITY;

-- DM-only for every operation. Do NOT use a raw EXISTS subquery against
-- email_whitelist here — that table's own RLS blocks it (see 021).
CREATE POLICY "DMs can read player_characters"
  ON public.player_characters FOR SELECT
  USING (get_user_role(auth.email()) = 'dm');

CREATE POLICY "DMs can insert player_characters"
  ON public.player_characters FOR INSERT
  WITH CHECK (get_user_role(auth.email()) = 'dm');

CREATE POLICY "DMs can update player_characters"
  ON public.player_characters FOR UPDATE
  USING (get_user_role(auth.email()) = 'dm');

CREATE POLICY "DMs can delete player_characters"
  ON public.player_characters FOR DELETE
  USING (get_user_role(auth.email()) = 'dm');
