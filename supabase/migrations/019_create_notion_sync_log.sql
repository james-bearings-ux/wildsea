-- Tracks which Notion pages have been processed and when
-- Allows the batch script to skip unchanged pages
CREATE TABLE notion_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL UNIQUE,
  page_title text,
  notion_last_edited timestamptz,
  processed_at timestamptz DEFAULT now(),
  npcs_extracted int DEFAULT 0,
  status text,                       -- success | error
  error_message text
);

-- Service role only -- this table is written by the batch script, never by the app
ALTER TABLE notion_sync_log ENABLE ROW LEVEL SECURITY;
