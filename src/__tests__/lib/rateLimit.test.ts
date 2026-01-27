// ============================================================================
// URL Lens - Rate Limiting Tests
// ============================================================================

import {
  checkRateLimit,
  getRateLimitHeaders,
  resetRateLimit,
  getRateLimitStatus,
} from '@/lib/rateLimit';

describe('Rate Limiting', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    // Reset rate limit before each test
    resetRateLimit(testUserId);
  });

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', () => {
      const result = checkRateLimit(testUserId);

      expect(result.allowed).toBe(true);
      expect(result.info.remaining).toBe(9); // 10 - 1
      expect(result.info.limit).toBe(10);
    });

    it('should track request count correctly', () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testUserId);
      }

      const status = getRateLimitStatus(testUserId);
      expect(status.remaining).toBe(5);
    });

    it('should deny requests when limit is exceeded', () => {
      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(testUserId);
      }

      const result = checkRateLimit(testUserId);
      expect(result.allowed).toBe(false);
      expect(result.info.remaining).toBe(0);
    });

    it('should track different users separately', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // Exhaust user1's limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(user1);
      }

      // user2 should still have full limit
      const user2Result = checkRateLimit(user2);
      expect(user2Result.allowed).toBe(true);
      expect(user2Result.info.remaining).toBe(9);

      // Clean up
      resetRateLimit(user1);
      resetRateLimit(user2);
    });

    it('should include reset time in info', () => {
      const result = checkRateLimit(testUserId);
      const now = Date.now();

      expect(result.info.reset).toBeGreaterThan(now);
      expect(result.info.reset).toBeLessThanOrEqual(now + 60 * 1000 + 100); // ~1 minute window
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return properly formatted headers', () => {
      const info = {
        remaining: 5,
        reset: Date.now() + 30000,
        limit: 10,
      };

      const headers = getRateLimitHeaders(info);

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('5');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });
  });

  describe('resetRateLimit', () => {
    it('should reset the rate limit for a user', () => {
      // Use up some requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testUserId);
      }

      // Reset
      resetRateLimit(testUserId);

      // Should have full limit again
      const status = getRateLimitStatus(testUserId);
      expect(status.remaining).toBe(10);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return status without incrementing count', () => {
      // Check status multiple times
      const status1 = getRateLimitStatus(testUserId);
      const status2 = getRateLimitStatus(testUserId);

      // Count should not have changed
      expect(status1.remaining).toBe(status2.remaining);
    });

    it('should return full limit for new users', () => {
      const newUserId = 'brand-new-user';
      const status = getRateLimitStatus(newUserId);

      expect(status.remaining).toBe(10);
      expect(status.limit).toBe(10);
    });
  });
});
