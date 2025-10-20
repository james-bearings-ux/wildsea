-- Add notes column to characters table
-- TEXT type is optimal for arbitrarily long text blobs in PostgreSQL
-- It has no practical length limit (up to ~1GB) and is more efficient than VARCHAR for long content

ALTER TABLE public.characters
ADD COLUMN notes TEXT DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN public.characters.notes IS 'Free-form text notes for the character. Supports multiline text with carriage returns.';
