// ============================================================================
// URL Lens - Share API Route Tests
// ============================================================================

import { NextRequest } from 'next/server';

// Mock Supabase
const mockGetUser = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: jest.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
    })),
  })),
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'new-share-id-123'),
}));

import { POST } from '@/app/api/share/route';

describe('POST /api/share', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Setup chain for queries - the chain is:
    // from().select().eq().single() - for fetching
    // from().update().eq().eq().select().single() - for updating
    mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({ analysis_id: 'analysis-123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 400 if analysis_id is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Analysis ID is required');
  });

  it('should return 400 for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid JSON');
  });

  it('should return 404 if analysis not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({ analysis_id: 'nonexistent-123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Analysis not found');
  });

  it('should return existing share_id if already shared', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'analysis-123', share_id: 'existing-share-id', user_id: mockUser.id },
      error: null
    });

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({ analysis_id: 'analysis-123' }),
      headers: { host: 'localhost:3000' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.share_id).toBe('existing-share-id');
    expect(data.share_url).toContain('existing-share-id');
  });

  it('should create new share_id if not already shared', async () => {
    // First call - get analysis (no share_id)
    mockSingle.mockResolvedValueOnce({
      data: { id: 'analysis-123', share_id: null, user_id: mockUser.id },
      error: null
    });

    // Second call - update with new share_id
    mockSingle.mockResolvedValueOnce({
      data: { id: 'analysis-123', share_id: 'new-share-id-123' },
      error: null
    });

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({ analysis_id: 'analysis-123' }),
      headers: { host: 'localhost:3000' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.share_id).toBe('new-share-id-123');
  });

  it('should return 500 if update fails', async () => {
    // First call - get analysis (no share_id)
    mockSingle.mockResolvedValueOnce({
      data: { id: 'analysis-123', share_id: null, user_id: mockUser.id },
      error: null
    });

    // Second call - update fails
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Update failed' }
    });

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({ analysis_id: 'analysis-123' }),
      headers: { host: 'localhost:3000' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Failed to create share link');
  });
});
