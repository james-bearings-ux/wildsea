-- Create a flag to mark the shared session
-- We'll use a simple approach: create one session with a known name/flag

-- Add a column to mark the shared session
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_sessions_is_shared ON public.sessions(is_shared) WHERE is_shared = TRUE;

-- Update RLS policies to allow all authenticated users to access the shared session
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own or shared sessions"
  ON public.sessions
  FOR SELECT
  USING (auth.uid() = user_id OR is_shared = TRUE);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own or shared sessions"
  ON public.sessions
  FOR UPDATE
  USING (auth.uid() = user_id OR is_shared = TRUE);

-- Keep create/delete restricted to session owners
-- Shared session will be created by admin or first user

-- Allow all authenticated users to add characters to shared session
CREATE POLICY "Users can add characters to shared session"
  ON public.session_characters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = session_id AND is_shared = TRUE
    )
  );

-- Allow all authenticated users to view characters in shared session
DROP POLICY IF EXISTS "Users can view session characters" ON public.session_characters;
CREATE POLICY "Users can view session characters"
  ON public.session_characters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND (s.user_id = auth.uid() OR s.is_shared = TRUE)
    )
  );

-- Allow all authenticated users to remove characters from shared session
CREATE POLICY "Users can remove characters from shared session"
  ON public.session_characters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = session_id AND is_shared = TRUE
    )
  );

-- Function to get or create the shared session
CREATE OR REPLACE FUNCTION public.get_or_create_shared_session()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Try to find existing shared session
  SELECT id INTO session_id
  FROM public.sessions
  WHERE is_shared = TRUE
  LIMIT 1;

  -- If no shared session exists, create one
  IF session_id IS NULL THEN
    INSERT INTO public.sessions (name, is_shared, user_id)
    VALUES ('Shared Campaign', TRUE, auth.uid())
    RETURNING id INTO session_id;
  END IF;

  RETURN session_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_shared_session() TO authenticated;
