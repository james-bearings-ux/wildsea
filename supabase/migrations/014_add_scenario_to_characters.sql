-- Add scenario column to characters table
-- VARCHAR type for scenario selection ('old dog' or 'young gun')
-- Defaults to 'old dog' for backwards compatibility with existing characters

ALTER TABLE public.characters
ADD COLUMN scenario VARCHAR(20) DEFAULT 'old dog';

-- Add comment for documentation
COMMENT ON COLUMN public.characters.scenario IS 'Character creation scenario: "old dog" (experienced, 6 resources) or "young gun" (inexperienced, 4 resources). Only affects creation mode resource budget.';
