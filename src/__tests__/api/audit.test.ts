// ============================================================================
// URL Lens - Audit API Tests
// ============================================================================

import { NextRequest } from 'next/server';

// Store original env
const originalEnv = process.env;

// Mock Supabase
const mockUser = { id: 'test-user-123', email: 'test@example.com' };
const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
  },
  from: jest.fn().mockReturnValue({
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'session-123' }, error: null }),
      }),
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }),
  }),
};

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue(mockSupabase),
}));

// Mock audit engine
const mockTestURL = jest.fn();
const mockProcessURLBatch = jest.fn();
const mockGenerateAuditSummary = jest.fn();
const mockValidateURLs = jest.fn();

jest.mock('@/lib/auditEngine', () => ({
  testURL: (...args: unknown[]) => mockTestURL(...args),
  processURLBatch: (...args: unknown[]) => mockProcessURLBatch(...args),
  generateAuditSummary: (...args: unknown[]) => mockGenerateAuditSummary(...args),
  validateURLs: (...args: unknown[]) => mockValidateURLs(...args),
}));

// Mock domain discovery
const mockDiscoverDomainURLs = jest.fn();

jest.mock('@/lib/domainDiscoveryEngine', () => ({
  discoverDomainURLs: (...args: unknown[]) => mockDiscoverDomainURLs(...args),
}));

describe('Audit API', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset environment
    process.env = { ...originalEnv, UNDER_DEV: 'true' };

    // Reset module cache to pick up env changes
    jest.resetModules();

    // Import POST handler
    const module = await import('@/app/api/audit/route');
    POST = module.POST;

    // Setup default mock returns
    mockValidateURLs.mockReturnValue({
      valid: ['https://example.com/', 'https://test.com/'],
      invalid: [],
    });

    mockProcessURLBatch.mockResolvedValue([
      {
        url: 'https://example.com/',
        finalUrl: 'https://example.com/',
        status: 200,
        accessible: true,
        redirects: [],
        jsRequired: false,
        botProtections: [],
        scrapeLikelihoodScore: 85,
        scoreBreakdown: { total: 85 },
        recommendation: 'good',
      },
    ]);

    mockGenerateAuditSummary.mockReturnValue({
      totalUrls: 1,
      accessibleCount: 1,
      blockedCount: 0,
      averageScore: 85,
      bestEntryPoints: [],
      byStatus: { 200: 1 },
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createRequest = (body: Record<string, unknown>) => {
    return new NextRequest('http://localhost:3000/api/audit', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  describe('Feature Flag', () => {
    it('should return 403 when feature is disabled', async () => {
      // Disable feature
      process.env.UNDER_DEV = 'false';
      jest.resetModules();
      const module = await import('@/app/api/audit/route');

      const request = createRequest({ mode: 'batch', urls: ['https://example.com'] });
      const response = await module.POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not yet available');
    });
  });

  describe('Request Validation', () => {
    it('should require mode parameter', async () => {
      const request = createRequest({ urls: ['https://example.com'] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Mode');
    });

    it('should require urls for batch mode', async () => {
      const request = createRequest({ mode: 'batch' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('URLs array');
    });

    it('should require domain for domain mode', async () => {
      const request = createRequest({ mode: 'domain' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Domain');
    });

    it('should reject URLs with invalid characters', async () => {
      const request = createRequest({
        mode: 'batch',
        urls: ['not a valid url', 'also not valid url'],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid URLs');
    });

    it('should reject more than 100 URLs', async () => {
      const urls = Array(101).fill('https://example.com');
      const request = createRequest({ mode: 'batch', urls });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Maximum');
    });

    it('should reject invalid domain format', async () => {
      const request = createRequest({ mode: 'domain', domain: 'invalid domain with spaces' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid domain');
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = createRequest({
        mode: 'batch',
        urls: ['https://example.com'],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Authentication');
    });
  });

  describe('Batch Mode', () => {
    it('should process batch of URLs successfully', async () => {
      const request = createRequest({
        mode: 'batch',
        urls: ['https://example.com', 'https://test.com'],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(data.summary).toBeDefined();
      expect(mockProcessURLBatch).toHaveBeenCalled();
    });

    it('should return session ID', async () => {
      const request = createRequest({
        mode: 'batch',
        urls: ['https://example.com'],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.sessionId).toBe('session-123');
    });
  });

  describe('Domain Mode', () => {
    it('should discover and audit domain URLs', async () => {
      mockDiscoverDomainURLs.mockResolvedValue({
        domain: 'example.com',
        rootAccessible: true,
        discoveredUrls: [
          { url: 'https://example.com/', source: 'sitemap' },
          { url: 'https://example.com/about', source: 'common_path' },
        ],
        sources: [],
      });

      const request = createRequest({
        mode: 'domain',
        domain: 'example.com',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.discovery).toBeDefined();
      expect(mockDiscoverDomainURLs).toHaveBeenCalledWith('example.com', expect.any(Object));
    });

    it('should handle domain with https:// prefix', async () => {
      mockDiscoverDomainURLs.mockResolvedValue({
        domain: 'example.com',
        rootAccessible: true,
        discoveredUrls: [{ url: 'https://example.com/', source: 'sitemap' }],
        sources: [],
      });

      const request = createRequest({
        mode: 'domain',
        domain: 'https://example.com/',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const request = createRequest({
        mode: 'batch',
        urls: ['https://example.com'],
      });
      const response = await POST(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });
});
