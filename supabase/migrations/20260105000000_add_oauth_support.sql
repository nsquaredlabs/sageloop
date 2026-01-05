-- =====================================================
-- Migration: Add OAuth support
-- =====================================================
-- This migration adds support for Google and GitHub OAuth authentication.
-- It leverages Supabase Auth's built-in OAuth provider support.
--
-- NOTE: No changes to auth.users or auth.identities needed.
-- Supabase manages these automatically.

-- 1. Update security_audit_logs table comment to document OAuth event types
COMMENT ON TABLE security_audit_logs IS
  'Security audit trail for authentication and security events.

   OAuth event types:
   - oauth_initiated: User clicked OAuth button
   - oauth_success: OAuth flow completed successfully
   - oauth_failed: OAuth flow failed (user denied, provider error, validation error)
   - account_linked: OAuth account linked to existing user
   - account_unlinked: User disconnected OAuth account

   Other event types:
   - prompt_create, prompt_update: Prompt operations
   - prompt_validation_failed: Validation failures
   - high_risk_prompt_detected: High-risk prompt attempts';

-- 2. Index on auth.identities is NOT needed
-- Supabase already manages indexes on auth.identities (system table)
-- We don't have permission to modify it, and appropriate indexes already exist
-- CREATE INDEX IF NOT EXISTS identities_user_id_provider_idx
--   ON auth.identities(user_id, provider);

-- 3. Add index for querying OAuth audit events efficiently
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_oauth_events
  ON security_audit_logs(event_type)
  WHERE event_type IN ('oauth_initiated', 'oauth_success', 'oauth_failed', 'account_linked', 'account_unlinked');

-- =====================================================
-- Data Retention Policy for Audit Logs (GDPR Compliance)
-- =====================================================

-- Auto-delete audit logs older than 90 days
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_audit_logs
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for admin functionality)
-- Note: In production, this should be called by a scheduled job
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs() TO authenticated;

-- =====================================================
-- RLS Policy Update for OAuth Audit Logs
-- =====================================================
-- Allow insert for authenticated users to log their own OAuth events
-- Note: The existing security_audit_logs table requires user_id to be NOT NULL,
-- but OAuth failures may occur before user authentication.
-- We'll update the table to allow null user_id for failed OAuth attempts.

-- Make user_id nullable for pre-auth OAuth events
ALTER TABLE security_audit_logs
  ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policy to allow inserting OAuth events (both authenticated and pre-auth)
-- First drop existing policies if they exist
DROP POLICY IF EXISTS security_audit_logs_insert_own ON security_audit_logs;

-- Create policy for inserting audit logs
-- Authenticated users can insert logs for themselves or null user_id (pre-auth events)
CREATE POLICY security_audit_logs_insert_own ON security_audit_logs
  FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR auth.uid() = user_id
  );

-- Update select policy to include null user_id handling
DROP POLICY IF EXISTS security_audit_logs_select_own ON security_audit_logs;

CREATE POLICY security_audit_logs_select_own ON security_audit_logs
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IS NULL -- Allow viewing pre-auth failures (admin use)
  );

-- =====================================================
-- Add OAuth-specific columns to security_audit_logs
-- =====================================================
-- These columns provide better querying for OAuth events

-- Add provider column for quick OAuth filtering
ALTER TABLE security_audit_logs
  ADD COLUMN IF NOT EXISTS provider TEXT;

-- Add index for OAuth provider queries
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_provider
  ON security_audit_logs(provider)
  WHERE provider IS NOT NULL;

-- Add comment for new column
COMMENT ON COLUMN security_audit_logs.provider IS
  'OAuth provider name (google, github) for OAuth-related events. NULL for non-OAuth events.';
