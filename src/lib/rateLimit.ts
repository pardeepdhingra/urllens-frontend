// ============================================================================
// URL Lens - Rate Limiting
// ============================================================================

import type { RateLimitInfo } from '@/types';

// In-memory store for rate limiting
// In production, you'd use Redis or a similar solution
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

// Configuration
const RATE_LIMIT_CONFIG = {
  // Requests per window
  maxRequests: 10,
  // Window duration in milliseconds (1 minute)
  windowMs: 60 * 1000,
  // Cleanup interval (5 minutes)
  cleanupIntervalMs: 5 * 60 * 1000,
};

// Cleanup old entries periodically
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, RATE_LIMIT_CONFIG.cleanupIntervalMs);

  // Don't prevent process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

// Start cleanup on module load
startCleanup();

/**
 * Check rate limit for a given identifier (usually user ID)
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  info: RateLimitInfo;
} {
  const now = Date.now();
  const { maxRequests, windowMs } = RATE_LIMIT_CONFIG;

  let entry = rateLimitStore.get(identifier);

  // Create new entry if doesn't exist or window has expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identifier, entry);
  }

  // Calculate remaining requests
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);

  const info: RateLimitInfo = {
    remaining,
    reset: entry.resetTime,
    limit: maxRequests,
  };

  // Check if rate limited
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      info,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    info: {
      ...info,
      remaining: remaining - 1,
    },
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(info: RateLimitInfo): Record<string, string> {
  return {
    'X-RateLimit-Limit': info.limit.toString(),
    'X-RateLimit-Remaining': info.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(info.reset / 1000).toString(),
  };
}

/**
 * Reset rate limit for a given identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(identifier: string): RateLimitInfo {
  const now = Date.now();
  const { maxRequests, windowMs } = RATE_LIMIT_CONFIG;

  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    return {
      remaining: maxRequests,
      reset: now + windowMs,
      limit: maxRequests,
    };
  }

  return {
    remaining: Math.max(0, maxRequests - entry.count),
    reset: entry.resetTime,
    limit: maxRequests,
  };
}
