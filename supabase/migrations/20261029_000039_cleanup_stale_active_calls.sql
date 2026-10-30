-- Migration: 20261029_000039_cleanup_stale_active_calls.sql
-- Close any stale calls left in 'ringing', 'accepted', or 'active' status from abandoned or historical test sessions.

UPDATE public.calls
SET 
  status = 'ended',
  ended_at = COALESCE(ended_at, expires_at, started_at + INTERVAL '1 minute', created_at + INTERVAL '1 minute'),
  end_reason = COALESCE(end_reason, 'timeout')
WHERE status IN ('ringing', 'accepted', 'active')
  AND (
    ended_at IS NOT NULL 
    OR created_at < NOW() - INTERVAL '30 minutes'
  );

-- Create a helper function / cleanup routine to ensure abandoned calls never remain active indefinitely
CREATE OR REPLACE FUNCTION public.cleanup_stale_calls()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.calls
  SET 
    status = 'ended',
    ended_at = COALESCE(ended_at, expires_at, started_at + INTERVAL '1 minute', created_at + INTERVAL '1 minute'),
    end_reason = COALESCE(end_reason, 'timeout')
  WHERE status IN ('ringing', 'accepted', 'active')
    AND (
      ended_at IS NOT NULL 
      OR created_at < NOW() - INTERVAL '30 minutes'
    );
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

