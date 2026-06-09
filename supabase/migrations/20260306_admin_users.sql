-- Create admin_users table for multi-admin support
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS - service_role bypasses RLS automatically
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Block all public/anon access (service_role key bypasses this)
DROP POLICY IF EXISTS "No public access" ON admin_users;
CREATE POLICY "No public access" ON admin_users
  FOR ALL
  USING (false);
