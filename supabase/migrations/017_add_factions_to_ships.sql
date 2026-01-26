-- Add factions column to ships table
-- Factions track reputation with each faction (0-3 reputation levels)

ALTER TABLE public.ships
ADD COLUMN factions JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.ships.factions IS 'Array of faction objects with id, name, and reputation (0-3)';
