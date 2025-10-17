-- Set replica identity to FULL for realtime postgres_changes
-- This tells PostgreSQL to include all columns in replication events,
-- which is required for Supabase realtime subscriptions

-- Enable full replica identity for all our tables
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER TABLE public.characters REPLICA IDENTITY FULL;
ALTER TABLE public.ships REPLICA IDENTITY FULL;
ALTER TABLE public.session_characters REPLICA IDENTITY FULL;

-- Verify the settings (optional - for confirmation)
SELECT
  schemaname,
  tablename,
  CASE relreplident
    WHEN 'd' THEN 'default'
    WHEN 'n' THEN 'nothing'
    WHEN 'f' THEN 'full'
    WHEN 'i' THEN 'index'
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE t.schemaname = 'public'
  AND t.tablename IN ('sessions', 'characters', 'ships', 'session_characters')
ORDER BY tablename;
