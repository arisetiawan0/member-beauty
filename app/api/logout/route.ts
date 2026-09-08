import { NextResponse } from 'next/server';

import { SESSION_COOKIE, cookieOptions } from '@/lib/session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return response;
}
