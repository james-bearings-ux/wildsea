-- Check which tables are in the supabase_realtime publication
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;
