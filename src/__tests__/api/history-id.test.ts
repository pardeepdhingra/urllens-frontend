// ============================================================================
// URL Lens - History Item API Route Tests
// ============================================================================

import { NextRequest } from 'next/server';

// Mock Supabase
const mockGetUser = jest.fn();
const mockSelect = jest.fn();
const mockDelete = jest.fn();
const mockSelectEq = jest.fn();
const mockDeleteEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: jest.fn(() => ({
      select: mockSelect,
      delete: mockDelete,
    })),
  })),
}));

import { DELETE } from '@/app/api/history/[id]/route';

describe('DELETE /api/history/[id]', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Setup chain for select: from().select().eq().single()
    mockSelect.mockReturnValue({ eq: mockSelectEq });
    mockSelectEq.mockReturnValue({ single: mockSingle });

    // Setup chain for delete: from().delete().eq().eq() - returns a promise
    mockDelete.mockReturnValue({ eq: mockDeleteEq });
    mockDeleteEq.mockReturnValue({ eq: mockDeleteEq });
    mockDeleteEq.mockResolvedValue({ error: null });

    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });

    const request = new NextRequest(`http://localhost:3000/api/history/${validUUID}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: validUUID }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 400 for invalid UUID format', async () => {
    const request = new NextRequest('http://localhost:3000/api/history/invalid-id', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid-id' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid record ID format');
  });

  it('should return 404 if record not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const request = new NextRequest(`http://localhost:3000/api/history/${validUUID}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: validUUID }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Record not found');
  });

  it('should return 403 if user does not own the record', async () => {
    mockSingle.mockResolvedValue({
      data: { id: validUUID, user_id: 'different-user-456' },
      error: null
    });

    const request = new NextRequest(`http://localhost:3000/api/history/${validUUID}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: validUUID }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Not authorized');
  });

  it('should successfully delete owned record', async () => {
    // Select returns the record owned by user
    mockSingle.mockResolvedValue({
      data: { id: validUUID, user_id: mockUser.id },
      error: null
    });

    // Delete succeeds - the second eq() call returns the resolved value
    mockDeleteEq.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

    const request = new NextRequest(`http://localhost:3000/api/history/${validUUID}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: validUUID }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 500 if delete operation fails', async () => {
    // Select returns the record owned by user
    mockSingle.mockResolvedValue({
      data: { id: validUUID, user_id: mockUser.id },
      error: null
    });

    // Delete fails - the second eq() call returns the resolved value
    mockDeleteEq.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }) });

    const request = new NextRequest(`http://localhost:3000/api/history/${validUUID}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: validUUID }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Failed to delete');
  });
});
