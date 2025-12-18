-- Security Audit Logs Table
--
-- Tracks security-related events for monitoring and anomaly detection.
-- Used to detect prompt injection attempts, suspicious patterns, and abuse.

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_created_at ON security_audit_logs(created_at DESC);
CREATE INDEX idx_security_audit_logs_metadata ON security_audit_logs USING gin(metadata);

-- RLS Policies
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY security_audit_logs_select_own ON security_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert audit logs (via service role)
-- Note: This will be done via server-side code with service role key

-- Comments
COMMENT ON TABLE security_audit_logs IS 'Security audit trail for monitoring prompt injection attempts and suspicious activity';
COMMENT ON COLUMN security_audit_logs.event_type IS 'Type of security event (e.g., prompt_create, prompt_update, prompt_validation_failed)';
COMMENT ON COLUMN security_audit_logs.metadata IS 'JSON metadata about the event (flags, risk level, prompt hash, etc.)';
COMMENT ON COLUMN security_audit_logs.ip_address IS 'Client IP address if available';
COMMENT ON COLUMN security_audit_logs.user_agent IS 'Client user agent if available';
