// ============================================================================
// URL Lens - Analyze API Route Tests
// ============================================================================

// Create mock functions that will be used in the mocks
const mockGetUser = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockAnalyzeUrlFn = jest.fn();
const mockAnalyzeUrlVisuallyFn = jest.fn();
const mockAnalyzeSEOFn = jest.fn();
const mockCalculateScoreFn = jest.fn();
const mockCheckRateLimitFn = jest.fn();
const mockGetRateLimitHeadersFn = jest.fn();

// Mock all dependencies BEFORE importing the route
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: jest.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
    })),
  })),
}));

jest.mock('@/lib/urlAnalyzer', () => ({
  analyzeUrl: (...args: unknown[]) => mockAnalyzeUrlFn(...args),
  normalizeUrl: jest.fn((url: string) => {
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    return url;
  }),
}));

jest.mock('@/lib/screenshotAnalyzer', () => ({
  analyzeUrlVisually: (...args: unknown[]) => mockAnalyzeUrlVisuallyFn(...args),
}));

jest.mock('@/lib/seoAnalyzer', () => ({
  analyzeSEO: (...args: unknown[]) => mockAnalyzeSEOFn(...args),
}));

jest.mock('@/lib/scoringEngine', () => ({
  calculateScore: (...args: unknown[]) => mockCalculateScoreFn(...args),
}));

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimitFn(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeadersFn(...args),
}));

// Import after mocks are set up
import { POST } from '@/app/api/analyze/route';
import { NextRequest } from 'next/server';

describe('POST /api/analyze', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

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

    // Default mock implementations
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockAnalyzeUrlFn.mockResolvedValue(mockAnalysisResult);
    mockAnalyzeUrlVisuallyFn.mockResolvedValue({
      screenshots: [],
      total_redirects: 0,
      final_url: 'https://example.com',
      blocked: false,
      analysis_duration_ms: 100,
    });
    mockAnalyzeSEOFn.mockResolvedValue({
      seo: { score: 80, grade: 'B', issues: [] },
      aeo: { score: 70, grade: 'C', issues: [] },
      geo: { score: 75, grade: 'B', issues: [] },
      llmo: { score: 65, grade: 'C', issues: [] },
      recommendations: [],
    });
    mockCalculateScoreFn.mockReturnValue({
      score: 85,
      recommendation: 'Good scrapability',
      breakdown: {},
    });
    mockCheckRateLimitFn.mockReturnValue({
      allowed: true,
      info: { remaining: 10, reset: Date.now() + 60000 }
    });
    mockGetRateLimitHeadersFn.mockReturnValue({});
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({
      data: { id: 'analysis-123', ...mockAnalysisResult },
      error: null
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 400 if URL is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('URL is required');
  });

  it('should return 400 for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid JSON');
  });

  it('should successfully analyze a valid URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockAnalyzeUrlFn).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });

  it('should include visual analysis when requested', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com', visualAnalysis: true }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockAnalyzeUrlVisuallyFn).toHaveBeenCalledWith('https://example.com');
  });

  it('should include SEO analysis when requested', async () => {
    mockAnalyzeUrlFn.mockResolvedValue({ ...mockAnalysisResult, html: '<html></html>' });

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com', seoAnalysis: true }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockAnalyzeSEOFn).toHaveBeenCalled();
  });

  it('should handle rate limiting', async () => {
    mockCheckRateLimitFn.mockReturnValue({
      allowed: false,
      info: { remaining: 0, reset: Date.now() + 60000 }
    });

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Rate limit');
  });

  it('should return analysis even if database save fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.saved).toBe(false);
  });
});
