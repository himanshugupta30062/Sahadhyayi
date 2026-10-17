-- ============================================================================
-- Migration: enhance_visitor_intelligence_rpc
-- Purpose: Enhance get_admin_recent_visits RPC to include visitor_id,
--          session_id, and verified user_id while preserving strict
--          server-side admin authorization.
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_admin_recent_visits(int, text);

CREATE OR REPLACE FUNCTION public.get_admin_recent_visits(
    p_limit int DEFAULT 100,
    p_search text DEFAULT NULL
)
RETURNS TABLE (
    id bigint,
    visited_at timestamp with time zone,
    ip_address text,
    country_code text,
    city text,
    region text,
    page_url text,
    browser text,
    browser_version text,
    os text,
    device_type text,
    device_model text,
    referrer text,
    screen_resolution text,
    language text,
    visitor_id uuid,
    session_id uuid,
    user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Strict server-side verification: reject any non-administrator
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can view visitor analytics.';
    END IF;

    RETURN QUERY
    SELECT 
        v.id,
        v.visited_at,
        COALESCE(v.ip_address::text, 'Unknown') AS ip_address,
        v.country_code,
        v.city,
        v.region,
        v.page_url,
        v.browser,
        v.browser_version,
        v.os,
        v.device_type,
        v.device_model,
        v.referrer,
        v.screen_resolution,
        v.language,
        v.visitor_id,
        v.session_id,
        v.user_id
    FROM public.website_visits v
    WHERE (p_search IS NULL 
           OR v.ip_address::text ILIKE '%' || p_search || '%'
           OR v.city ILIKE '%' || p_search || '%'
           OR v.country_code ILIKE '%' || p_search || '%'
           OR v.page_url ILIKE '%' || p_search || '%'
           OR v.referrer ILIKE '%' || p_search || '%'
           OR v.visitor_id::text ILIKE '%' || p_search || '%')
    ORDER BY v.visited_at DESC
    LIMIT p_limit;
END;
$$;

-- Revoke all public access
REVOKE ALL ON FUNCTION public.get_admin_recent_visits(int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_recent_visits(int, text) TO authenticated, service_role;

