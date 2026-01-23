-- =====================================================
-- Migration: Add pgmq wrapper functions for RPC access
-- Supabase RPC only exposes public schema functions,
-- so we need wrappers for the pgmq.* functions
-- =====================================================

-- Read messages from a queue
-- pgmq.read returns: msg_id, read_ct, enqueued_at, vt, message, headers (6 columns)
create or replace function pgmq_read(
  p_queue_name text,
  p_vt int,
  p_qty int
)
returns table(
  msg_id bigint,
  read_ct int,
  enqueued_at timestamp with time zone,
  vt timestamp with time zone,
  message jsonb,
  headers jsonb
)
language plpgsql
security definer
as $$
begin
  return query select * from pgmq.read(p_queue_name, p_vt, p_qty);
end;
$$;

-- Delete a message from a queue
create or replace function pgmq_delete(
  p_queue_name text,
  p_msg_id bigint
)
returns boolean
language plpgsql
security definer
as $$
begin
  return pgmq.delete(p_queue_name, p_msg_id);
end;
$$;

-- Grant execute permissions to service_role (used by Edge Functions)
grant execute on function pgmq_read to service_role;
grant execute on function pgmq_delete to service_role;
