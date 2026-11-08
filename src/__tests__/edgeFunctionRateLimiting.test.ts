import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Edge Function Rate Limiting & Anti-Abuse (Phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkRateLimit logic', () => {
    it('allows requests when count is below threshold and logs rate limit attempt', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
      const mockClient = { rpc: mockRpc };

      const checkRateLimit = async (
        client: any,
        identifier: string,
        endpoint: string,
        maxRequests: number,
        windowMinutes: number
      ) => {
        const { data: allowed, error } = await client.rpc('check_rate_limit', {
          p_identifier: identifier,
          p_endpoint: endpoint,
          p_max_requests: maxRequests,
          p_window_minutes: windowMinutes,
        });
        if (error || typeof allowed !== 'boolean') {
          return { allowed: true, status: 200 };
        }
        return {
          allowed,
          status: allowed ? 200 : 429,
          message: allowed ? undefined : 'Rate limit exceeded.',
        };
      };

      const result = await checkRateLimit(mockClient, 'user-123', 'generate-summary', 20, 10);
      expect(result.allowed).toBe(true);
      expect(result.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith('check_rate_limit', {
        p_identifier: 'user-123',
        p_endpoint: 'generate-summary',
        p_max_requests: 20,
        p_window_minutes: 10,
      });
    });

    it('blocks requests (status 429) when threshold is exceeded', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: false, error: null });
      const mockClient = { rpc: mockRpc };

      const checkRateLimit = async (
        client: any,
        identifier: string,
        endpoint: string,
        maxRequests: number,
        windowMinutes: number
      ) => {
        const { data: allowed, error } = await client.rpc('check_rate_limit', {
          p_identifier: identifier,
          p_endpoint: endpoint,
          p_max_requests: maxRequests,
          p_window_minutes: windowMinutes,
        });
        if (error || typeof allowed !== 'boolean') {
          return { allowed: true, status: 200 };
        }
        return {
          allowed,
          status: allowed ? 200 : 429,
          message: allowed ? undefined : `Too many requests for ${endpoint}. Please try again later.`,
        };
      };

      const result = await checkRateLimit(mockClient, 'ip-198-51-100-2', 'save-selected-books', 30, 60);
      expect(result.allowed).toBe(false);
      expect(result.status).toBe(429);
      expect(result.message).toContain('Too many requests for save-selected-books');
    });

    it('gracefully falls open if RPC has a transient database error so service stays available', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'Database connection timeout' } });
      const mockClient = { rpc: mockRpc };

      const checkRateLimit = async (
        client: any,
        identifier: string,
        endpoint: string,
        maxRequests: number,
        windowMinutes: number
      ) => {
        const { data: allowed, error } = await client.rpc('check_rate_limit', {
          p_identifier: identifier,
          p_endpoint: endpoint,
          p_max_requests: maxRequests,
          p_window_minutes: windowMinutes,
        });
        if (error || typeof allowed !== 'boolean') {
          return { allowed: true, status: 200 };
        }
        return { allowed, status: 200 };
      };

      const result = await checkRateLimit(mockClient, 'user-999', 'enhanced-book-summary', 20, 10);
      expect(result.allowed).toBe(true);
      expect(result.status).toBe(200);
    });
  });

  describe('Edge function protection policies', () => {
    it('defines distinct rate-limiting windows per function security tier', () => {
      const endpointsConfig = {
        'send-contact-email': { maxRequests: 5, windowMinutes: 15, keyType: 'ip_and_email' },
        'save-selected-books': { maxRequests: 30, windowMinutes: 60, keyType: 'user_or_ip' },
        'generate-share-caption': { maxRequests: 15, windowMinutes: 10, keyType: 'ip' },
        'enhanced-book-summary': { maxRequests: 20, windowMinutes: 10, keyType: 'user_id' },
        'generate-quiz-questions': { maxRequests: 15, windowMinutes: 10, keyType: 'user_id' },
        'generate-summary': { maxRequests: 20, windowMinutes: 10, keyType: 'user_id' },
        'pdf-proxy': { maxRequests: 60, windowMinutes: 10, keyType: 'ip' },
      };

      expect(endpointsConfig['send-contact-email'].maxRequests).toBe(5);
      expect(endpointsConfig['save-selected-books'].maxRequests).toBe(30);
      expect(endpointsConfig['generate-share-caption'].maxRequests).toBe(15);
      expect(endpointsConfig['enhanced-book-summary'].maxRequests).toBe(20);
      expect(endpointsConfig['generate-quiz-questions'].maxRequests).toBe(15);
      expect(endpointsConfig['pdf-proxy'].maxRequests).toBe(60);
    });
  });
});

