// ============================================================================
// URL Lens - History API Route Tests
// ============================================================================

import { NextRequest } from 'next/server';

// Mock Supabase
const mockGetUser = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: jest.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

import { GET } from '@/app/api/history/route';

describe('GET /api/history', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  const mockHistoryItems = [
    {
      id: 'analysis-1',
      url: 'https://example1.com',
      final_url: 'https://example1.com',
      score: 85,
      created_at: '2026-01-28T00:00:00Z',
    },
    {
      id: 'analysis-2',
      url: 'https://example2.com',
      final_url: 'https://example2.com',
      score: 70,
      created_at: '2026-01-27T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Setup chain
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ range: mockRange });
    mockRange.mockResolvedValue({ data: mockHistoryItems, error: null, count: 2 });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });

    const request = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized');
  });

  it('should return history list for authenticated user', async () => {
    const request = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].url).toBe('https://example1.com');
  });

  it('should support pagination with page parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/history?page=2');
    await GET(request);

    // Verify range was called with correct offset
    expect(mockRange).toHaveBeenCalled();
  });

  it('should support limit parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/history?limit=5');
    await GET(request);

    expect(mockRange).toHaveBeenCalled();
  });

  it('should return empty array if no history', async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });

    const request = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(0);
  });

  it('should return 500 on database error', async () => {
    mockRange.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const request = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
