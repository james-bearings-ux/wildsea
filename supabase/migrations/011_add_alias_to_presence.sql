-- Add alias field to presence table and create function to get alias from whitelist

-- Add alias column to session_presence
ALTER TABLE public.session_presence ADD COLUMN IF NOT EXISTS user_alias TEXT;

-- Function to get user alias from whitelist
-- Returns the notes field if present, otherwise returns username part of email
CREATE OR REPLACE FUNCTION public.get_user_alias(user_email_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  alias_value TEXT;
BEGIN
  -- Try to get notes from whitelist
  SELECT notes INTO alias_value
  FROM public.email_whitelist
  WHERE LOWER(email) = LOWER(user_email_param);

  -- If notes exists and is not empty, return it
  IF alias_value IS NOT NULL AND alias_value != '' THEN
    RETURN alias_value;
  END IF;

  -- Otherwise, return username part of email (before @)
  RETURN split_part(user_email_param, '@', 1);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_alias(TEXT) TO authenticated;
