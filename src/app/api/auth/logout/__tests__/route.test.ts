/**
 * Tests for Logout API Endpoint
 * Story: 4.1 - Password Authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { cookies } from 'next/headers';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('POST /api/auth/logout', () => {
  const mockCookieStore = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
  });

  it('should return 200 and delete session cookie', async () => {
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Logged out successfully');

    // Verify session cookie was deleted
    expect(mockCookieStore.delete).toHaveBeenCalledWith('dashboard-session');
  });

  it('should handle errors gracefully', async () => {
    mockCookieStore.delete.mockImplementation(() => {
      throw new Error('Cookie error');
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('An error occurred during logout');
  });
});
