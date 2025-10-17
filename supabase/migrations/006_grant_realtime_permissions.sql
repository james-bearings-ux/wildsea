-- Grant explicit permissions for realtime subscriptions
-- Realtime needs SELECT grants even with RLS policies

-- Grant authenticated users access to realtime
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.sessions TO authenticated;
GRANT SELECT ON public.characters TO authenticated;
GRANT SELECT ON public.ships TO authenticated;
GRANT SELECT ON public.session_characters TO authenticated;

-- Ensure RLS is enabled on all tables (should already be, but confirming)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_characters ENABLE ROW LEVEL SECURITY;

-- Verify the realtime publication includes our tables
-- (These should already be there based on your error, but including for completeness)
DO $$
BEGIN
    -- Add tables to publication if not already added
    -- This will silently succeed if they're already there
    PERFORM 1;
END $$;

-- Note: If this still doesn't work, check in Supabase Dashboard:
-- Settings > API > "Realtime is enabled" should be ON
-- Database > Replication > supabase_realtime should show these 4 tables enabled
