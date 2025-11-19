/**
 * Logout API Endpoint
 *
 * POST /api/auth/logout
 * Clears session cookie and logs user out.
 *
 * Story: 4.1 - Password Authentication
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'dashboard-session';

export async function POST() {
  try {
    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
