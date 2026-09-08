/**
 * Session = a signed cookie holding nothing but the member's Affari `Kode`
 * (PRD §6). Signed with HS256 via Web Crypto so it works on both the Node and
 * Edge runtimes without pulling in a JWT dependency.
 */
export const SESSION_COOKIE = 'beauty_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (PRD §6)

type Payload = { kode: string; iat: number; exp: number };

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters.');
  }
  return value;
}

async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function createSession(kode: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: Payload = { kode, iat: now, exp: now + SESSION_MAX_AGE };
  const head = b64url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await key(), encoder.encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(new Uint8Array(signature))}`;
}

/** Returns the member code, or null when the token is absent, forged or expired. */
export async function readSession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [head, body, signature] = parts;
  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      'HMAC',
      await key(),
      unb64url(signature),
      encoder.encode(`${head}.${body}`),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(unb64url(body))) as Payload;
    if (!payload.kode || typeof payload.exp !== 'number') return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload.kode;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE,
} as const;
