-- Admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_username TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by date and user
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON admin_activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_username ON admin_activity_log (admin_username);

-- Enable RLS - service_role bypasses automatically
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access" ON admin_activity_log;
CREATE POLICY "No public access" ON admin_activity_log
  FOR ALL
  USING (false);

-- Auto-delete logs older than 30 days (run via Supabase cron or pg_cron)
-- You can set up a cron job in Supabase Dashboard > Database > Extensions > pg_cron:
-- SELECT cron.schedule('cleanup-activity-log', '0 3 * * *', $$DELETE FROM admin_activity_log WHERE created_at < NOW() - INTERVAL '30 days'$$);
