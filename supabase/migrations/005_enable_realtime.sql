-- Enable Realtime for all tables
-- This allows real-time subscriptions to receive postgres_changes events

-- Enable realtime on sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;

-- Enable realtime on characters table
ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;

-- Enable realtime on ships table
ALTER PUBLICATION supabase_realtime ADD TABLE public.ships;

-- Enable realtime on session_characters junction table
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_characters;
