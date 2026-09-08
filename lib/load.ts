import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { demoMode, getHistory, getMember } from '@/lib/affari/client';
import { SESSION_COOKIE, readSession } from '@/lib/session';
import { AffariError, type Member, type Transaction } from '@/lib/types';
import * as demo from '@/lib/demo';

export type PageData = {
  member: Member;
  transactions: Transaction[];
  /** True when no AFFARI_TOKEN is set and the sample member is being shown. */
  demo: boolean;
  /** The card and balance loaded but the history call did not. */
  historyFailed: boolean;
};

/**
 * Loads everything a member page renders.
 *
 * The card and balance are required — if they fail the page cannot be drawn and
 * the error bubbles to error.tsx. History is treated as optional: losing it
 * degrades one panel instead of the whole page.
 */
export async function loadMemberData(): Promise<PageData> {
  if (demoMode()) {
    return { member: demo.member, transactions: demo.transactions, demo: true, historyFailed: false };
  }

  const kode = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!kode) redirect('/login?alasan=sesi');

  let member: Member;
  try {
    member = await getMember(kode);
  } catch (error) {
    // A session pointing at a member Affari no longer returns is a dead session.
    if (error instanceof AffariError && error.kind === 'not-found') redirect('/login?alasan=sesi');
    throw error;
  }

  let transactions: Transaction[] = [];
  let historyFailed = false;
  try {
    transactions = await getHistory(kode);
  } catch (error) {
    historyFailed = true;
    console.error('[affari] history failed for', kode, error);
  }

  return { member, transactions, demo: false, historyFailed };
}
