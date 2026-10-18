-- Migration: 20261018210000_enable_public_community_pulse_rpc.sql
-- Description: Ensure public read permissions for aggregate community pulse RPCs
-- Allows the frontend to safely read aggregate counts and statistics without leaking individual visitor or user records.

-- 1. Grant execute on public aggregate RPCs to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.get_website_visit_count() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_total_users_count() TO anon, authenticated, service_role;

-- 2. Grant execute on get_community_pulse_stats to anon and authenticated
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'get_community_pulse_stats'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.get_community_pulse_stats(text) TO anon, authenticated, service_role;
  END IF;
END $$;
