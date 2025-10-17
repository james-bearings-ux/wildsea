-- Insert your 5 whitelisted emails
-- Replace with actual email addresses

INSERT INTO public.email_whitelist (email, notes) VALUES
  ('example1@example.com', 'Player 1'),
  ('example2@example.com', 'Player 2'),
  ('example3@example.com', 'Player 3'),
  ('example4@example.com', 'Player 4'),
  ('example5@example.com', 'Player 5')
ON CONFLICT (email) DO NOTHING;

-- To add more emails later, use:
-- INSERT INTO public.email_whitelist (email, notes) VALUES ('newemail@example.com', 'New player');
