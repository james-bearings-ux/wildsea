# Supabase Migrations

## Setup Instructions

Run these SQL migrations in your Supabase SQL Editor in order:

1. **001_create_whitelist.sql** - Creates the email whitelist table and function
2. **002_add_user_id_to_sessions.sql** - Adds user_id to sessions table
3. **003_add_whitelist_emails.sql** - Insert your 5 whitelisted emails (edit first!)
4. **004_create_shared_session.sql** - Creates shared session for multiplayer
5. **005_enable_realtime.sql** - Enables real-time subscriptions on all tables (IMPORTANT!)
6. **006_grant_realtime_permissions.sql** - Grants SELECT permissions for realtime
7. **008_set_replica_identity.sql** - Sets replica identity to FULL (CRITICAL for realtime!)

## Configuring Magic Link Auth

In your Supabase Dashboard:

1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. Disable **Email confirmations** (or configure email templates)
4. Under **Email Templates**, customize the Magic Link template if desired
5. Set **Site URL** to your production URL
6. Add redirect URLs:
   - `http://localhost:5173/**`
   - `http://localhost:4173/**`
   - Your production URL (if different from Site URL)

## Adding Whitelisted Emails

Edit `003_add_whitelist_emails.sql` with your actual email addresses before running.

To add more emails later, run:
```sql
INSERT INTO public.email_whitelist (email, notes)
VALUES ('newemail@example.com', 'Description');
```

## Shared Session (Multiplayer)

After running migration 004, all authenticated users will automatically join the same shared session. This enables:
- All players see the same characters and ship
- Real-time updates when anyone makes changes
- Collaborative character/ship management

The shared session is created automatically when the first user signs in.

## Testing Locally

Make sure your `.env` file has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
