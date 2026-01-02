-- Add dice_rolls column to sessions table for multiplayer dice rolling
ALTER TABLE sessions ADD COLUMN dice_rolls JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN sessions.dice_rolls IS 'Array of dice roll objects with structure: {id, userId, userName, diceCount, values, timestamp, visible}';
