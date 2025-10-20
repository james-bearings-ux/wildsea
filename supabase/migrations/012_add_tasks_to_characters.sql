-- Add tasks column to characters table
-- Tasks track progress with clock ticks (1-6 ticks)

ALTER TABLE public.characters
ADD COLUMN tasks JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.characters.tasks IS 'Array of task objects with id, name, maxTicks, currentTicks, and editing state';
