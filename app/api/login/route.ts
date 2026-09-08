import { NextResponse } from 'next/server';

import { demoMode, findMember } from '@/lib/affari/client';
import { SESSION_COOKIE, cookieOptions, createSession } from '@/lib/session';
import { AffariError, failureMessage } from '@/lib/types';
import * as demo from '@/lib/demo';

const STATUS = { 'not-found': 404, upstream: 502, config: 503 } as const;

export async function POST(request: Request) {
  let value = '';
  try {
    const body = (await request.json()) as { value?: unknown };
    value = typeof body.value === 'string' ? body.value.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
  }

  if (!value) {
    return NextResponse.json({ error: 'Masukkan nomor HP atau nomor kartu terlebih dahulu.' }, { status: 400 });
  }

  // In development without a token the sample member stands in. In production
  // this branch never runs, so a misconfigured deploy fails loudly below.
  if (demoMode()) {
    const normalized = value.replace(/[\s-]/g, '').replace(/^\+62/, '0').toUpperCase();
    if (normalized === demo.member.phone || normalized === demo.member.card) {
      return NextResponse.json({ ok: true, demo: true });
    }
    return NextResponse.json({ error: failureMessage['not-found'], kind: 'not-found' }, { status: 404 });
  }

  try {
    const member = await findMember(value);
    const response = NextResponse.json({ ok: true, demo: false });
    response.cookies.set(SESSION_COOKIE, await createSession(member.kode), cookieOptions);
    return response;
  } catch (error) {
    if (error instanceof AffariError) {
      if (error.kind !== 'not-found') console.error('[affari] login failed:', error.kind, error.detail);
      return NextResponse.json(
        { error: failureMessage[error.kind], kind: error.kind },
        { status: STATUS[error.kind] },
      );
    }
    console.error('[affari] login crashed:', error);
    return NextResponse.json({ error: failureMessage.upstream, kind: 'upstream' }, { status: 500 });
  }
}
