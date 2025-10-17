-- Diagnostic query to check if realtime is properly configured

-- Check if the publication exists
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Check which tables are in the publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Alternative: If the publication doesn't exist or adding tables failed,
-- you can also enable realtime via the Supabase Dashboard:
--
-- 1. Go to Database > Replication in your Supabase Dashboard
-- 2. Find the 'supabase_realtime' source
-- 3. Enable these tables:
--    - public.sessions
--    - public.characters
--    - public.ships
--    - public.session_characters
