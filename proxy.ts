import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE, readSession } from '@/lib/session';

/**
 * Keeps member pages behind a valid session. Skipped only in development demo
 * mode (no token), so the sample data stays reachable without login. Production
 * always enforces the session, even if the token is missing.
 */
export default async function proxy(request: NextRequest) {
  const demoMode = !process.env.AFFARI_TOKEN && process.env.NODE_ENV !== 'production';
  if (demoMode) return NextResponse.next();

  const kode = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (kode) return NextResponse.next();

  const login = new URL('/login', request.url);
  login.searchParams.set('alasan', 'sesi');
  const response = NextResponse.redirect(login);
  // Drop the stale cookie so the browser stops sending a token we just rejected.
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

export const config = { matcher: ['/', '/riwayat', '/info'] };
