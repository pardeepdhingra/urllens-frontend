// ============================================================================
// URL Lens - Guest Analyze API Route Tests
// ============================================================================

// Create mock functions
const mockInsert = jest.fn();
const mockAnalyzeUrlFn = jest.fn();
const mockCalculateScoreFn = jest.fn();

// Mock Supabase service client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

// Mock URL analyzer
jest.mock('@/lib/urlAnalyzer', () => ({
  analyzeUrl: (...args: unknown[]) => mockAnalyzeUrlFn(...args),
  normalizeUrl: jest.fn((url: string) => {
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    return url;
  }),
}));

// Mock scoring engine
jest.mock('@/lib/scoringEngine', () => ({
  calculateScore: (...args: unknown[]) => mockCalculateScoreFn(...args),
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-share-id'),
}));

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_APP_URL = 'https://test.com';

import { POST } from '@/app/api/guest-analyze/route';
import { NextRequest } from 'next/server';

describe('POST /api/guest-analyze', () => {
  const mockAnalysisResult = {
    url: 'https://example.com',
    finalUrl: 'https://example.com',
    status: 200,
    redirects: [],
    responseTimeMs: 150,
    contentType: 'text/html',
    jsHints: false,
    botProtections: [],
    headers: {},
    robotsTxt: null,
    rateLimitInfo: null,
    utmAnalysis: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyzeUrlFn.mockResolvedValue(mockAnalysisResult);
    mockCalculateScoreFn.mockReturnValue({
      score: 85,
      recommendation: 'Good scrapability',
    });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('should return 400 if URL is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/guest-analyze', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('URL is required');
  });

  it('should return 400 for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost:3000/api/guest-analyze', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid JSON');
  });

  it('should successfully analyze a valid URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/guest-analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.url).toBe('https://example.com');
    expect(data.data.share_url).toContain('test-share-id');
    expect(mockAnalyzeUrlFn).toHaveBeenCalledWith('https://example.com');
  });

  it('should return share URL and share ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/guest-analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.share_id).toBe('test-share-id');
    expect(data.data.share_url).toBe('https://test.com/share/test-share-id');
  });

  it('should include rate limit headers', async () => {
    const request = new NextRequest('http://localhost:3000/api/guest-analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const response = await POST(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });

  it('should return bot protection info', async () => {
    mockAnalyzeUrlFn.mockResolvedValue({
      ...mockAnalysisResult,
      botProtections: [{ type: 'cloudflare', confidence: 'high' }],
    });

    const request = new NextRequest('http://localhost:3000/api/guest-analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://protected.com' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.bot_protections).toHaveLength(1);
    expect(data.data.bot_protections[0].type).toBe('cloudflare');
  });

  it('should return UTM analysis if present', async () => {
    mockAnalyzeUrlFn.mockResolvedValue({
      ...mockAnalysisResult,
      utmAnalysis: {
        hasUtmParams: true,
        utmPreserved: true,
        paramsRemoved: [],
        paramsModified: [],
      },
    });

    const request = new NextRequest('http://localhost:3000/api/guest-analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com?utm_source=test' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.utm_analysis).toBeDefined();
    expect(data.data.utm_analysis.hasUtmParams).toBe(true);
  });

  it('should continue even if database save fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    const request = new NextRequest('http://localhost:3000/api/guest-analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const response = await POST(request);
    const data = await response.json();

    // Should still return success since we return analysis even on DB failure
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
