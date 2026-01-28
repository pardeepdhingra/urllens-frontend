// ============================================================================
// URL Lens - Discover API Tests
// ============================================================================

import { NextRequest } from 'next/server';

// Store original env
const originalEnv = process.env;

// Mock Supabase
const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

// Mock domain discovery engine
const mockDiscoverDomainURLs = jest.fn();
jest.mock('@/lib/domainDiscoveryEngine', () => ({
  discoverDomainURLs: (...args: unknown[]) => mockDiscoverDomainURLs(...args),
}));

// Import after mocks
import { POST } from '@/app/api/discover/route';

describe('Discover API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset env
    process.env = { ...originalEnv, UNDER_DEV: 'true' };
    // Default to authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-123' } },
      error: null,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost:3000/api/discover', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  describe('Feature Flag', () => {
    it('should return 403 when feature flag is disabled', async () => {
      process.env.UNDER_DEV = 'false';

      const request = createRequest({ domain: 'example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('This feature is not yet available');
    });

    it('should allow requests when feature flag is enabled', async () => {
      process.env.UNDER_DEV = 'true';
      mockDiscoverDomainURLs.mockResolvedValue({
        domain: 'example.com',
        rootAccessible: true,
        discoveredUrls: [],
        sources: [],
      });

      const request = createRequest({ domain: 'example.com' });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = createRequest({ domain: 'example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('Request Validation', () => {
    it('should return 400 for missing domain', async () => {
      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Domain is required');
    });

    it('should return 400 for invalid domain format', async () => {
      const request = createRequest({ domain: 'not a domain!' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid domain format');
    });

    it('should accept valid domain', async () => {
      mockDiscoverDomainURLs.mockResolvedValue({
        domain: 'example.com',
        rootAccessible: true,
        discoveredUrls: [],
        sources: [],
      });

      const request = createRequest({ domain: 'example.com' });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should accept domain with subdomain', async () => {
      mockDiscoverDomainURLs.mockResolvedValue({
        domain: 'sub.example.com',
        rootAccessible: true,
        discoveredUrls: [],
        sources: [],
      });

      const request = createRequest({ domain: 'sub.example.com' });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should strip protocol from domain', async () => {
      mockDiscoverDomainURLs.mockResolvedValue({
        domain: 'example.com',
        rootAccessible: true,
        discoveredUrls: [],
        sources: [],
      });

      const request = createRequest({ domain: 'https://example.com' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockDiscoverDomainURLs).toHaveBeenCalledWith(
        'example.com',
        expect.any(Object)
      );
    });

    it('should validate maxUrls range', async () => {
      const request = createRequest({ domain: 'example.com', maxUrls: 1000 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('maxUrls must be a number between 1 and 500');
    });

    it('should accept valid maxUrls', async () => {
      mockDiscoverDomainURLs.mockResolvedValue({
        domain: 'example.com',
        rootAccessible: true,
        discoveredUrls: [],
        sources: [],
      });

      const request = createRequest({ domain: 'example.com', maxUrls: 50 });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockDiscoverDomainURLs).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({ maxUrls: 50 })
      );
    });

    it('should validate includeCommonPaths type', async () => {
      const request = createRequest({ domain: 'example.com', includeCommonPaths: 'yes' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('includeCommonPaths must be a boolean');
    });
  });

  describe('Discovery Response', () => {
    it('should return discovery results', async () => {
      const mockDiscovery = {
        domain: 'example.com',
        rootAccessible: true,
        rootStatus: 200,
        discoveredUrls: [
          { url: 'https://example.com/', source: 'common_path' },
          { url: 'https://example.com/about', source: 'sitemap' },
        ],
        sources: [
          { type: 'sitemap', url: 'https://example.com/sitemap.xml', urlsFound: 1 },
        ],
      };

      mockDiscoverDomainURLs.mockResolvedValue(mockDiscovery);

      const request = createRequest({ domain: 'example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.discovery).toEqual(mockDiscovery);
    });

    it('should handle domain with blocked root', async () => {
      const mockDiscovery = {
        domain: 'protected.com',
        rootAccessible: false,
        rootStatus: 403,
        rootBlockedReason: 'HTTP 403',
        discoveredUrls: [
          { url: 'https://protected.com/blog', source: 'sitemap' },
        ],
        sources: [
          { type: 'sitemap', url: 'https://protected.com/sitemap.xml', urlsFound: 1 },
        ],
      };

      mockDiscoverDomainURLs.mockResolvedValue(mockDiscovery);

      const request = createRequest({ domain: 'protected.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.discovery.rootAccessible).toBe(false);
      expect(data.discovery.discoveredUrls.length).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      mockDiscoverDomainURLs.mockResolvedValue({
        domain: 'example.com',
        rootAccessible: true,
        discoveredUrls: [],
        sources: [],
      });

      const request = createRequest({ domain: 'example.com' });
      const response = await POST(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle discovery errors gracefully', async () => {
      mockDiscoverDomainURLs.mockRejectedValue(new Error('Network error'));

      const request = createRequest({ domain: 'example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Network error');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/discover', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });
  });
});
