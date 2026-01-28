// ============================================================================
// URL Lens - Social Preview API Route Tests
// ============================================================================

import { NextRequest } from 'next/server';

// Mock Supabase
const mockGetUser = jest.fn();
const mockInsert = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: jest.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

// Mock social preview analyzer
const mockAnalyzeSocialPreview = jest.fn();

jest.mock('@/lib/socialPreviewAnalyzer', () => ({
  analyzeSocialPreview: (...args: unknown[]) => mockAnalyzeSocialPreview(...args),
}));

import { POST } from '@/app/api/social-preview/route';

describe('POST /api/social-preview', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  const mockPreviewResult = {
    url: 'https://example.com',
    finalUrl: 'https://example.com',
    metadata: {
      title: 'Test Title',
      description: 'Test Description',
      canonical: 'https://example.com',
      images: [{ url: 'https://example.com/image.jpg' }],
      raw: {
        ogTitle: 'Test Title',
        ogDescription: 'Test Description',
        images: [],
      },
    },
    platforms: {
      facebook: { title: 'Test', description: 'Desc', warnings: [] },
      linkedin: { title: 'Test', description: 'Desc', warnings: [] },
      google: { title: 'Test', description: 'Desc', warnings: [] },
      twitter: { title: 'Test', description: 'Desc', warnings: [] },
      whatsapp: { title: 'Test', description: 'Desc', warnings: [] },
      telegram: { title: 'Test', description: 'Desc', warnings: [] },
    },
    fetchedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockAnalyzeSocialPreview.mockResolvedValue(mockPreviewResult);
    mockInsert.mockResolvedValue({ error: null });
  });

  it('should return 400 for missing URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('URL is required');
  });

  it('should return 400 for invalid URL format', async () => {
    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({ url: '://invalid' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid URL');
  });

  it('should return 400 for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid JSON');
  });

  it('should successfully analyze URL and return preview', async () => {
    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.preview).toBeDefined();
    expect(data.preview.url).toBe('https://example.com');
    expect(data.preview.platforms).toBeDefined();
    expect(data.preview.platforms.facebook).toBeDefined();
    expect(data.preview.platforms.linkedin).toBeDefined();
    expect(data.preview.platforms.google).toBeDefined();
    expect(data.preview.platforms.twitter).toBeDefined();
    expect(data.preview.platforms.whatsapp).toBeDefined();
    expect(data.preview.platforms.telegram).toBeDefined();
  });

  it('should include rate limit headers', async () => {
    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const response = await POST(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });

  it('should save preview for authenticated users', async () => {
    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(request);

    expect(mockInsert).toHaveBeenCalled();
  });

  it('should not save preview for unauthenticated users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    await POST(request);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should handle analyzer errors gracefully', async () => {
    mockAnalyzeSocialPreview.mockRejectedValue(new Error('Fetch failed'));

    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Fetch failed');
  });

  it('should return 422 for access denied errors', async () => {
    mockAnalyzeSocialPreview.mockRejectedValue(new Error('HTTP 403: Forbidden'));

    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toContain('authentication');
  });

  it('should return 504 for timeout errors', async () => {
    const timeoutError = new Error('timeout');
    timeoutError.name = 'AbortError';
    mockAnalyzeSocialPreview.mockRejectedValue(timeoutError);

    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(504);
    expect(data.error).toContain('timed out');
  });

  it('should return 422 for non-HTML responses', async () => {
    mockAnalyzeSocialPreview.mockRejectedValue(new Error('Response is not HTML'));

    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/api.json' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toContain('HTML');
  });

  it('should allow URLs without protocol', async () => {
    // Use a different user to avoid rate limits from previous tests
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-unique-protocol-test', email: 'unique@example.com' } }, error: null });

    const request = new NextRequest('http://localhost:3000/api/social-preview', {
      method: 'POST',
      body: JSON.stringify({ url: 'example.com' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
