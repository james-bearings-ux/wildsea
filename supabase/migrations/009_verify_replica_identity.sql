-- Verify replica identity settings
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN 'default (primary key only)'
    WHEN 'n' THEN 'nothing'
    WHEN 'f' THEN 'full (all columns)'
    WHEN 'i' THEN 'index'
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('sessions', 'characters', 'ships', 'session_characters')
ORDER BY c.relname;
