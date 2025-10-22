-- Migration: Add Journey Feature Columns
-- Run this in your Supabase SQL Editor

-- Add journey_role column to characters table
ALTER TABLE characters
ADD COLUMN journey_role TEXT DEFAULT '';

-- Add journey column to ships table (JSONB for structured data)
ALTER TABLE ships
ADD COLUMN journey JSONB DEFAULT '{
  "active": false,
  "name": "",
  "clocks": {
    "progress": {"max": 6, "filled": 0},
    "risk": {"max": 6, "filled": 0},
    "pathfinding": {"max": 6, "filled": 0},
    "riot": {"max": 6, "filled": 0}
  }
}'::jsonb;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'characters' AND column_name = 'journey_role';

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ships' AND column_name = 'journey';
