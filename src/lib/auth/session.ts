/**
 * Authentication Utilities
 *
 * Provides session checking and validation for protected routes.
 * Story: 4.1 - Password Authentication
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_COOKIE_NAME = 'dashboard-session';

/**
 * Check if user has a valid session
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  // For MVP: simply check if session cookie exists
  // Post-MVP: validate JWT or check session in database
  return !!sessionCookie?.value;
}

/**
 * Get session cookie value
 * @returns Session token if exists, null otherwise
 */
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value || null;
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in Server Components/Actions that require auth
 */
export async function requireAuth(): Promise<void> {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect('/login');
  }
}
