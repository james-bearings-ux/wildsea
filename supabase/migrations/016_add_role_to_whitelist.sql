-- Add role column to email_whitelist table
-- Default role is 'player', DMs should be manually set to 'dm'

ALTER TABLE public.email_whitelist
ADD COLUMN role TEXT NOT NULL DEFAULT 'player';

-- Add constraint to only allow 'player' or 'dm' as valid roles
ALTER TABLE public.email_whitelist
ADD CONSTRAINT valid_role CHECK (role IN ('player', 'dm'));

-- Create index on role for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_whitelist_role ON public.email_whitelist(role);

-- Create function to get user role by email
CREATE OR REPLACE FUNCTION public.get_user_role(user_email_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.email_whitelist
  WHERE LOWER(email) = LOWER(user_email_param);

  -- Return 'player' if user not found (should not happen, but fail safely)
  RETURN COALESCE(user_role, 'player');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(TEXT) TO authenticated, anon;
