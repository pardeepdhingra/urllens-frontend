// ============================================================================
// URL Lens - Audit History API Tests
// ============================================================================

import { NextRequest } from 'next/server';

// Store original env
const originalEnv = process.env;

// Mock results storage
let mockSessionsResult: { data: unknown; error: unknown } = { data: [], error: null };
let mockScoresResult: { data: unknown; error: unknown } = { data: [], error: null };
let mockSessionResult: { data: unknown; error: unknown } = { data: null, error: null };
let mockResultsResult: { data: unknown; error: unknown } = { data: [], error: null };
let mockDeleteResult: { error: unknown } = { error: null };

// Mock Supabase
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockImplementation(() => Promise.resolve({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => {
      if (table === 'url_audit_sessions') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                range: () => Promise.resolve(mockSessionsResult),
              }),
              eq: () => ({
                single: () => Promise.resolve(mockSessionResult),
              }),
              single: () => Promise.resolve(mockSessionResult),
            }),
          }),
          delete: () => ({
            eq: () => ({
              eq: () => Promise.resolve(mockDeleteResult),
            }),
          }),
        };
      }
      if (table === 'url_audit_results') {
        return {
          select: () => ({
            in: () => Promise.resolve(mockScoresResult),
            eq: () => ({
              order: () => Promise.resolve(mockResultsResult),
            }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      };
    },
  })),
}));

// Import after mocks
import { GET } from '@/app/api/audit/history/route';
import { GET as GET_DETAIL, DELETE } from '@/app/api/audit/history/[id]/route';

describe('Audit History API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, UNDER_DEV: 'true' };
    // Reset mock results
    mockSessionsResult = { data: [], error: null };
    mockScoresResult = { data: [], error: null };
    mockSessionResult = { data: null, error: null };
    mockResultsResult = { data: [], error: null };
    mockDeleteResult = { error: null };
    // Default to authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-123' } },
      error: null,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET /api/audit/history', () => {
    function createRequest(params?: Record<string, string>): NextRequest {
      const url = new URL('http://localhost:3000/api/audit/history');
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }
      return new NextRequest(url, { method: 'GET' });
    }

    it('should return 403 when feature flag is disabled', async () => {
      process.env.UNDER_DEV = 'false';

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('This feature is not yet available');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return audit sessions for authenticated user', async () => {
      mockSessionsResult = {
        data: [
          {
            id: 'session-1',
            mode: 'domain',
            domain: 'example.com',
            total_urls: 10,
            completed_urls: 10,
            status: 'completed',
            created_at: '2025-01-29T10:00:00Z',
            completed_at: '2025-01-29T10:05:00Z',
          },
        ],
        error: null,
      };
      mockScoresResult = {
        data: [{ session_id: 'session-1', scrape_score: 85 }],
        error: null,
      };

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessions).toBeDefined();
      expect(data.sessions[0].id).toBe('session-1');
    });

    it('should return empty sessions array when no history', async () => {
      mockSessionsResult = { data: [], error: null };

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessions).toEqual([]);
    });
  });

  describe('GET /api/audit/history/[id]', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    function createRequest(): NextRequest {
      return new NextRequest(`http://localhost:3000/api/audit/history/${validUUID}`, {
        method: 'GET',
      });
    }

    it('should return 403 when feature flag is disabled', async () => {
      process.env.UNDER_DEV = 'false';

      const request = createRequest();
      const response = await GET_DETAIL(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/history/invalid-id', {
        method: 'GET',
      });
      const response = await GET_DETAIL(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid session ID format');
    });

    it('should return 404 when session not found', async () => {
      mockSessionResult = { data: null, error: { message: 'Not found' } };

      const request = createRequest();
      const response = await GET_DETAIL(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Audit session not found');
    });

    it('should return session details with results', async () => {
      mockSessionResult = {
        data: {
          id: validUUID,
          mode: 'batch',
          domain: null,
          total_urls: 5,
          completed_urls: 5,
          status: 'completed',
          created_at: '2025-01-29T10:00:00Z',
          completed_at: '2025-01-29T10:02:00Z',
        },
        error: null,
      };
      mockResultsResult = {
        data: [
          {
            id: 'result-1',
            url: 'https://example.com',
            status_code: 200,
            final_url: 'https://example.com/',
            scrape_score: 90,
            requires_js: false,
            bot_protections: [],
            accessible: true,
            recommendation: 'Best Entry Point',
            blocked_reason: null,
            content_type: 'text/html',
            response_time_ms: 150,
          },
        ],
        error: null,
      };

      const request = createRequest();
      const response = await GET_DETAIL(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session).toBeDefined();
      expect(data.session.id).toBe(validUUID);
      expect(data.session.results).toHaveLength(1);
      expect(data.session.summary).toBeDefined();
    });
  });

  describe('DELETE /api/audit/history/[id]', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    function createRequest(): NextRequest {
      return new NextRequest(`http://localhost:3000/api/audit/history/${validUUID}`, {
        method: 'DELETE',
      });
    }

    it('should return 403 when feature flag is disabled', async () => {
      process.env.UNDER_DEV = 'false';

      const request = createRequest();
      const response = await DELETE(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/history/invalid-id', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid session ID format');
    });

    it('should delete session successfully', async () => {
      mockDeleteResult = { error: null };

      const request = createRequest();
      const response = await DELETE(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 500 on delete error', async () => {
      mockDeleteResult = { error: { message: 'Delete failed' } };

      const request = createRequest();
      const response = await DELETE(request, { params: Promise.resolve({ id: validUUID }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
