import 'server-only';

import { AffariError, type Member, type Transaction } from '@/lib/types';
import { historySince } from '@/lib/format';
import { toMember, toTransaction } from './map';

const BASE = (process.env.AFFARI_BASE_URL ?? 'https://api.affariretail.id/beauty/').replace(/\/+$/, '');
const TOKEN = process.env.AFFARI_TOKEN;
const TIMEOUT_MS = Number(process.env.AFFARI_TIMEOUT_MS ?? 12000);

/**
 * Which `field` values /api/member is searched by, in order. A member is
 * identified by phone OR card number and the endpoint takes one field at a
 * time, so login walks the list until something matches.
 */
const LOGIN_FIELDS = (process.env.AFFARI_LOGIN_FIELDS ?? 'kode,nohp').split(',').map((f) => f.trim()).filter(Boolean);

/**
 * Demo (sample-member) mode is a development-only convenience: it activates
 * only when no token is set AND the app is not running in production. In
 * production a missing token is a real misconfiguration that must surface as a
 * `config` error, never as silent fake member data.
 */
export const demoMode = () => !TOKEN && process.env.NODE_ENV !== 'production';

type Raw = Record<string, unknown>;

/**
 * The Affari docs warn that a failure can still arrive as HTTP 200, so every
 * call is checked twice: transport status first, then the `IsSuccess` flag.
 */
async function call(path: string, params: Record<string, string>): Promise<unknown> {
  if (!TOKEN) {
    throw new AffariError('config', 'AFFARI_TOKEN is not set', 'Set AFFARI_TOKEN in the environment.');
  }

  const url = new URL(`${BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { affari_token: TOKEN, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (cause) {
    throw new AffariError('upstream', 'Affari request failed', cause instanceof Error ? cause.message : String(cause));
  }

  if (!response.ok) {
    throw new AffariError('upstream', 'Affari returned an error status', `HTTP ${response.status} for ${path}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AffariError('upstream', 'Affari returned a non-JSON body', `for ${path}`);
  }

  // `IsSuccess: false` inside a 200 is a real failure — not an empty result.
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const flag = (body as Raw).IsSuccess ?? (body as Raw).isSuccess;
    if (flag === false) {
      const message = String((body as Raw).Message ?? (body as Raw).message ?? 'unknown reason');
      throw new AffariError('upstream', 'Affari reported a failure', `${path}: ${message}`);
    }
    // Some endpoints wrap the payload; unwrap when they do.
    for (const key of ['Data', 'data', 'Result', 'result']) {
      if (key in (body as Raw)) return (body as Raw)[key];
    }
  }

  return body;
}

/** Narrows an Affari response to the rows it carries. `{}` means "no match". */
function rows(payload: unknown): Raw[] {
  if (Array.isArray(payload)) return payload.filter((row): row is Raw => !!row && typeof row === 'object');
  if (payload && typeof payload === 'object') {
    const record = payload as Raw;
    return Object.keys(record).length === 0 ? [] : [record];
  }
  return [];
}

/**
 * Looks a member up by phone or card number.
 *
 * PRD §5.1: a number is never shared between members, so a match is always a
 * single object. An array is treated as a fallback — first element, plus a log
 * — rather than a supported UI path.
 */
export async function findMember(value: string): Promise<Member> {
  const trimmed = value.trim();
  if (!trimmed) throw new AffariError('not-found', 'Empty lookup value');

  let lastUpstream: AffariError | null = null;

  for (const field of LOGIN_FIELDS) {
    let payload: unknown;
    try {
      payload = await call('/api/member', { field, value: trimmed });
    } catch (error) {
      if (error instanceof AffariError && error.kind === 'upstream') {
        // One field erroring shouldn't hide a match on the next one.
        lastUpstream = error;
        continue;
      }
      throw error;
    }

    const matches = rows(payload);
    if (matches.length === 0) continue;
    if (matches.length > 1) {
      console.warn(`[affari] ${matches.length} members matched field=${field}; using the first. PRD assumes uniqueness.`);
    }

    const member = toMember(matches[0]);
    if (member.kode) return member;
    console.warn(`[affari] member matched on field=${field} but carries no Kode; ignoring.`);
  }

  if (lastUpstream) throw lastUpstream;
  throw new AffariError('not-found', 'No member matched');
}

/** Re-reads the member behind a session, for fresh points on every page load. */
export async function getMember(kode: string): Promise<Member> {
  const matches = rows(await call('/api/member', { field: 'kode', value: kode }));
  if (matches.length === 0) throw new AffariError('not-found', 'Session member no longer exists');
  return toMember(matches[0]);
}

/** Point history since `from` (YYYY-MM-DD). Empty history is a valid answer. */
export async function getHistory(kode: string, from = historySince()): Promise<Transaction[]> {
  const payload = await call('/api/listhistoripoint', { kode, tanggal: from });
  return rows(payload)
    .map(toTransaction)
    .filter((transaction) => transaction.date !== '')
    .sort((a, b) => b.date.localeCompare(a.date));
}
