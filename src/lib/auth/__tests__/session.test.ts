/**
 * Tests for Session Utilities
 * Story: 4.1 - Password Authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isAuthenticated, getSession, requireAuth } from '../session';
import { cookies } from 'next/headers';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Session Utilities', () => {
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
  });

  describe('isAuthenticated', () => {
    it('should return true if session cookie exists', async () => {
      mockCookieStore.get.mockReturnValue({
        name: 'dashboard-session',
        value: 'session_123_abc',
      });

      const result = await isAuthenticated();
      expect(result).toBe(true);
      expect(mockCookieStore.get).toHaveBeenCalledWith('dashboard-session');
    });

    it('should return false if session cookie does not exist', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return false if session cookie has no value', async () => {
      mockCookieStore.get.mockReturnValue({
        name: 'dashboard-session',
        value: '',
      });

      const result = await isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('getSession', () => {
    it('should return session token if exists', async () => {
      const sessionToken = 'session_123_abc';
      mockCookieStore.get.mockReturnValue({
        name: 'dashboard-session',
        value: sessionToken,
      });

      const result = await getSession();
      expect(result).toBe(sessionToken);
    });

    it('should return null if session does not exist', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await getSession();
      expect(result).toBeNull();
    });

    it('should return null if session has no value', async () => {
      mockCookieStore.get.mockReturnValue({
        name: 'dashboard-session',
        value: '',
      });

      const result = await getSession();
      expect(result).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('should not throw if session exists', async () => {
      mockCookieStore.get.mockReturnValue({
        name: 'dashboard-session',
        value: 'session_123_abc',
      });

      await expect(requireAuth()).resolves.not.toThrow();
    });

    it('should redirect if session does not exist', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT');
    });
  });
});
