-- Admin config table (stores hashed secret word)
CREATE TABLE IF NOT EXISTS admin_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No public access" ON admin_config;
CREATE POLICY "No public access" ON admin_config FOR ALL USING (false);

-- Login attempts tracking per IP
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip_address TEXT PRIMARY KEY,
  attempts INT DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No public access" ON admin_login_attempts;
CREATE POLICY "No public access" ON admin_login_attempts FOR ALL USING (false);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_blocked ON admin_login_attempts (blocked_until);
