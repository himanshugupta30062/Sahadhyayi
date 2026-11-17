import { supabase } from '@/integrations/supabase/client-universal';

export type AuthAuditEvent =
  | 'sign_in_attempted'
  | 'sign_in_succeeded'
  | 'sign_in_failed'
  | 'signup_submitted'
  | 'signup_failed'
  | 'account_created';

export type AuthAuditMethod = 'password' | 'oauth' | 'unknown';

/** Best-effort audit telemetry. Never blocks or changes the authentication result. */
export async function recordAuthAudit(
  eventType: AuthAuditEvent,
  authMethod: AuthAuditMethod = 'unknown',
  details?: { userId?: string; errorCode?: string },
): Promise<void> {
  try {
    await supabase.functions.invoke('auth-audit', {
      body: {
        event_type: eventType,
        auth_method: authMethod,
        ...(details?.userId ? { user_id: details.userId } : {}),
        ...(details?.errorCode ? { error_code: details.errorCode } : {}),
      },
    });
  } catch {
    // Authentication must remain available if optional audit telemetry is unavailable.
  }
}
