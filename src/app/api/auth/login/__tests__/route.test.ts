/**
 * Tests for Login API Endpoint
 * Story: 4.1 - Password Authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('POST /api/auth/login', () => {
  const mockCookieStore = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
    // Set default environment variable
    process.env.DASHBOARD_PASSWORD = 'test-password-123';
  });

  it('should return 400 if password is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password is required');
  });

  it('should return 400 if password is not a string', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 123 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password is required');
  });

  it('should return 500 if DASHBOARD_PASSWORD is not set', async () => {
    delete process.env.DASHBOARD_PASSWORD;

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'any-password' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error');
  });

  it('should return 401 if password is incorrect', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong-password' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid password');
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it('should return 200 and set session cookie if password is correct', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'test-password-123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Login successful');

    // Verify session cookie was set
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'dashboard-session',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: false, // NODE_ENV is not 'production' in tests
        sameSite: 'lax',
        path: '/',
        // No maxAge - session cookie expires when browser closes
      })
    );
  });
});
