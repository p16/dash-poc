/**
 * Middleware for Route Protection
 *
 * Protects /dashboard routes by redirecting unauthenticated users to /login
 * Story: 4.1 - Password Authentication
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'dashboard-session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user is accessing protected routes
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    // Redirect to login if no session
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If accessing login while already authenticated, redirect to dashboard
  if (pathname === '/login') {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    if (sessionCookie) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
