-- Create whitelist table for authorized users
CREATE TABLE IF NOT EXISTS public.email_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.email_whitelist ENABLE ROW LEVEL SECURITY;

-- Only allow admins to read the whitelist (using service role key)
-- Regular users cannot see the whitelist
CREATE POLICY "Service role can manage whitelist"
  ON public.email_whitelist
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_whitelist_email ON public.email_whitelist(email);

-- Insert initial whitelist emails (replace with actual emails)
-- INSERT INTO public.email_whitelist (email, notes) VALUES
--   ('user1@example.com', 'Initial user'),
--   ('user2@example.com', 'Initial user'),
--   ('user3@example.com', 'Initial user'),
--   ('user4@example.com', 'Initial user'),
--   ('user5@example.com', 'Initial user');

-- Function to check if email is whitelisted
CREATE OR REPLACE FUNCTION public.is_email_whitelisted(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.email_whitelist
    WHERE LOWER(email) = LOWER(check_email)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_email_whitelisted(TEXT) TO authenticated, anon;
