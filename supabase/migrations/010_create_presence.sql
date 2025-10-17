-- Create session presence tracking table
-- Tracks which users are actively viewing which session

CREATE TABLE IF NOT EXISTS public.session_presence (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, session_id)
);

-- Index for fast lookup by session
CREATE INDEX IF NOT EXISTS idx_session_presence_session_id ON public.session_presence(session_id);
CREATE INDEX IF NOT EXISTS idx_session_presence_last_seen ON public.session_presence(last_seen);

-- Enable RLS
ALTER TABLE public.session_presence ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view presence for sessions they're in
CREATE POLICY "Users can view presence in their sessions"
  ON public.session_presence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND (s.user_id = auth.uid() OR s.is_shared = TRUE)
    )
  );

-- Policy: Users can update their own presence
CREATE POLICY "Users can update own presence"
  ON public.session_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence record"
  ON public.session_presence
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean up stale presence records (older than 1 minute)
CREATE OR REPLACE FUNCTION public.cleanup_stale_presence()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.session_presence
  WHERE last_seen < NOW() - INTERVAL '1 minute';
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_stale_presence() TO authenticated;
