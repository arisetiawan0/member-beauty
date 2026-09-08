const TZ = 'Asia/Makassar';

export const number = (value: number) => new Intl.NumberFormat('id-ID').format(value);

export const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

/** Formats a YYYY-MM-DD string. Anchored at midday WITA so the day never slips. */
export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(
    new Date(value + 'T12:00:00+08:00'),
  );

/** Today in WITA as YYYY-MM-DD. */
export function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/**
 * PRD §5.2: `tanggal` on /api/listhistoripoint means "since this date", so the
 * default reaches back far enough that a member sees a full year of activity.
 */
export function historySince(monthsBack = 18): string {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
  return from.toISOString().slice(0, 10);
}
