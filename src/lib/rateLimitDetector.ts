// ============================================================================
// URL Lens - Rate Limit Detector
// ============================================================================

import axios from 'axios';
import type { RateLimitDetection } from '@/types';

const CONFIG = {
  timeout: 5000,
  maxRequests: 5, // Number of requests to make for detection
  delayBetweenRequests: 100, // ms between requests
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// Common rate limit headers to look for
const RATE_LIMIT_HEADERS = [
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'x-rate-limit-limit',
  'x-rate-limit-remaining',
  'x-rate-limit-reset',
  'ratelimit-limit',
  'ratelimit-remaining',
  'ratelimit-reset',
  'retry-after',
  'x-retry-after',
];

/**
 * Detects rate limiting on a URL by making multiple requests
 */
export async function detectRateLimit(url: string): Promise<RateLimitDetection> {
  const headersFound: string[] = [];
  let requestsMade = 0;
  let requestsSucceeded = 0;
  let estimatedLimit: number | undefined;
  let timeWindowSeconds: number | undefined;
  let detected = false;

  // Track response times and status codes
  const responses: Array<{ status: number; headers: Record<string, string>; time: number }> = [];

  try {
    // Make multiple requests in quick succession
    for (let i = 0; i < CONFIG.maxRequests; i++) {
      const startTime = Date.now();

      try {
        const response = await axios.head(url, {
          timeout: CONFIG.timeout,
          validateStatus: () => true,
          headers: {
            'User-Agent': CONFIG.userAgent,
          },
        });

        const elapsed = Date.now() - startTime;
        requestsMade++;

        // Normalize headers to lowercase
        const normalizedHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(response.headers)) {
          if (typeof value === 'string') {
            normalizedHeaders[key.toLowerCase()] = value;
          }
        }

        responses.push({
          status: response.status,
          headers: normalizedHeaders,
          time: elapsed,
        });

        // Check if request succeeded (2xx or 3xx)
        if (response.status >= 200 && response.status < 400) {
          requestsSucceeded++;
        }

        // Check for rate limiting status codes
        if (response.status === 429 || response.status === 503) {
          detected = true;
        }

        // Check for rate limit headers
        for (const headerName of RATE_LIMIT_HEADERS) {
          if (normalizedHeaders[headerName] && !headersFound.includes(headerName)) {
            headersFound.push(headerName);
            detected = true;
          }
        }

        // Extract rate limit info from headers
        if (normalizedHeaders['x-ratelimit-limit'] || normalizedHeaders['ratelimit-limit']) {
          const limit = parseInt(
            normalizedHeaders['x-ratelimit-limit'] ||
              normalizedHeaders['ratelimit-limit'] ||
              '0',
            10
          );
          if (limit > 0) {
            estimatedLimit = limit;
          }
        }

        if (normalizedHeaders['retry-after']) {
          const retryAfter = parseInt(normalizedHeaders['retry-after'], 10);
          if (!isNaN(retryAfter)) {
            timeWindowSeconds = retryAfter;
          }
        }

        // Small delay between requests
        if (i < CONFIG.maxRequests - 1) {
          await new Promise((resolve) => setTimeout(resolve, CONFIG.delayBetweenRequests));
        }
      } catch (error) {
        requestsMade++;
        // Request failed - could be rate limiting
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          detected = true;
        }
      }
    }

    // Analyze response patterns for implicit rate limiting
    if (!detected && responses.length >= 3) {
      // Check for increasing response times (possible throttling)
      const times = responses.map((r) => r.time);
      const avgFirstHalf = times.slice(0, Math.floor(times.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(times.length / 2);
      const avgSecondHalf = times.slice(Math.floor(times.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(times.length / 2);

      if (avgSecondHalf > avgFirstHalf * 2) {
        detected = true;
      }

      // Check for degrading status codes
      const failedLaterRequests = responses.slice(2).filter((r) => r.status >= 400).length;
      if (failedLaterRequests > 0) {
        detected = true;
      }
    }

    return {
      detected,
      requests_made: requestsMade,
      requests_succeeded: requestsSucceeded,
      estimated_limit: estimatedLimit,
      time_window_seconds: timeWindowSeconds,
      headers_found: headersFound,
    };
  } catch (error) {
    return {
      detected: false,
      requests_made: requestsMade,
      requests_succeeded: requestsSucceeded,
      headers_found: headersFound,
    };
  }
}

/**
 * Gets a human-readable summary of rate limit detection
 */
export function getRateLimitSummary(result: RateLimitDetection): string {
  if (!result.detected) {
    return 'No rate limiting detected after ${result.requests_made} test requests.';
  }

  const parts: string[] = ['Rate limiting DETECTED.'];

  if (result.estimated_limit) {
    parts.push(`Estimated limit: ${result.estimated_limit} requests.`);
  }

  if (result.time_window_seconds) {
    parts.push(`Reset window: ${result.time_window_seconds} seconds.`);
  }

  if (result.headers_found.length > 0) {
    parts.push(`Headers found: ${result.headers_found.join(', ')}.`);
  }

  parts.push(`${result.requests_succeeded}/${result.requests_made} test requests succeeded.`);

  return parts.join(' ');
}
