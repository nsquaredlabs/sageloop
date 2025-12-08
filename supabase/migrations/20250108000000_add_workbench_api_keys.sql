-- =====================================================
-- Migration: Add encrypted API key storage for workbenches
-- =====================================================

-- Enable pgcrypto extension for encryption
create extension if not exists pgcrypto;

-- 1. Add encrypted API keys column to workbenches
alter table workbenches
  add column encrypted_api_keys text;

-- 2. Create a vault secret for encryption key
-- This needs to be set manually via Supabase dashboard or CLI:
-- INSERT INTO vault.secrets (name, secret) VALUES ('tellah_master_key', 'your-32-byte-key-here');
-- For now, we'll use a default that should be replaced in production

-- 3. Add helper function to store encrypted API keys
-- This function encrypts the API keys JSONB and stores it using pgcrypto
create or replace function set_workbench_api_keys(
  workbench_uuid uuid,
  api_keys_json jsonb
)
returns void as $$
declare
  encryption_key text;
begin
  -- Use a fixed encryption key for dev (in production, use env var or vault)
  encryption_key := 'tellah_encryption_key_dev_only_replace_in_prod';

  update workbenches
  set
    encrypted_api_keys = pgp_sym_encrypt(
      api_keys_json::text,
      encryption_key
    ),
    updated_at = now()
  where id = workbench_uuid;
end;
$$ language plpgsql security definer;

-- 4. Add helper function to retrieve and decrypt API keys
-- Returns NULL if no keys are set, or the decrypted JSONB
create or replace function get_workbench_api_keys(workbench_uuid uuid)
returns jsonb as $$
declare
  encrypted_data text;
  encryption_key text;
begin
  select encrypted_api_keys into encrypted_data
  from workbenches
  where id = workbench_uuid;

  if encrypted_data is null then
    return null;
  end if;

  -- Use same encryption key as set function
  encryption_key := 'tellah_encryption_key_dev_only_replace_in_prod';

  return pgp_sym_decrypt(
    encrypted_data::bytea,
    encryption_key
  )::jsonb;
exception
  when others then
    -- If decryption fails, return null
    return null;
end;
$$ language plpgsql security definer;

-- 5. Add helper function to check if API keys are configured
-- Returns a JSONB object with provider names as keys and boolean values
-- Does NOT return the actual keys (for security)
create or replace function check_workbench_api_keys(workbench_uuid uuid)
returns jsonb as $$
declare
  api_keys jsonb;
  result jsonb;
begin
  api_keys := get_workbench_api_keys(workbench_uuid);

  if api_keys is null then
    return '{}'::jsonb;
  end if;

  -- Return object with provider names and true/false for configured
  -- Check if value exists and is not empty string
  select jsonb_object_agg(
    key,
    (value is not null
     and value != 'null'::jsonb
     and value != '""'::jsonb
     and (value::text != '""' or value::text != 'null'))
  )
  into result
  from jsonb_each(api_keys);

  return coalesce(result, '{}'::jsonb);
end;
$$ language plpgsql security definer;

-- 6. Grant execute permissions to authenticated users
grant execute on function set_workbench_api_keys(uuid, jsonb) to authenticated;
grant execute on function get_workbench_api_keys(uuid) to authenticated;
grant execute on function check_workbench_api_keys(uuid) to authenticated;

-- Note: We rely on RLS policies on workbenches table to ensure users
-- can only access API keys for workbenches they belong to.
-- The security definer functions will run with elevated privileges but
-- the application code must verify workbench access before calling them.
