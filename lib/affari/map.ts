/**
 * ── THE ONLY FILE THAT GUESSES AFFARI FIELD NAMES ──────────────────────────
 *
 * The PRD confirms `Kode`, `JMember`, `PointAkhir`, `TglBerakhir` and `IsSuccess`.
 * Everything else below is a candidate list: the first key that exists on the
 * payload wins. Paste a real response into `docs/affari-sample.json` and trim
 * these lists down to the actual names — nothing outside this file changes.
 */
import type { Member, Transaction } from '@/lib/types';

type Raw = Record<string, unknown>;

/** Documented placeholder for "no real birth/join date on file" (PRD §6.1). */
const SENTINEL_DATES = ['1900/01/01', '1900-01-01', '01/01/1900', '0001-01-01'];

function pick(row: Raw, keys: string[]): unknown {
  for (const key of keys) {
    // Affari casing has been inconsistent across endpoints; match case-insensitively.
    const match = Object.keys(row).find((k) => k.toLowerCase() === key.toLowerCase());
    if (match !== undefined && row[match] !== null && row[match] !== '') return row[match];
  }
  return undefined;
}

function text(row: Raw, keys: string[], fallback = ''): string {
  const value = pick(row, keys);
  return value === undefined ? fallback : String(value).trim();
}

/**
 * Parses a number that may arrive as a JSON number, an Indonesian-formatted
 * string ("3.150", "1.250.000,50") or a plain decimal string ("1250000.00").
 *
 * Indonesian uses "." for thousands and "," for decimals, so a bare "3.150"
 * is three thousand one hundred and fifty — not three point one five.
 */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === undefined || value === null) return 0;

  const cleaned = String(value).trim().replace(/[^\d,.-]/g, '');
  if (!cleaned) return 0;

  let normalized: string;
  if (cleaned.includes(',')) {
    // A comma is present, so it is the decimal mark and every dot groups thousands.
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    const groups = cleaned.split('.');
    // Dots are thousands separators only when every group after the first is a full triple.
    const isGrouped = groups.length > 1 && groups.slice(1).every((group) => /^\d{3}$/.test(group));
    normalized = isGrouped ? groups.join('') : cleaned;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(row: Raw, keys: string[]): number {
  return toNumber(pick(row, keys));
}

/** Normalises the several date shapes Affari has been seen to return. */
export function isoDate(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).trim();
  if (SENTINEL_DATES.includes(raw.slice(0, 10))) return null;

  // 2026-09-05, 2026-09-05T00:00:00, 2026/09/05
  const ymd = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  // 05/09/2026 and 05-09-2026 are day-first in Affari exports.
  const dmy = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  // /Date(1757030400000)/
  const dotnet = raw.match(/\/Date\((-?\d+)/);
  if (dotnet) return new Date(Number(dotnet[1])).toISOString().slice(0, 10);

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

const longDate = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' })
    .format(new Date(iso + 'T12:00:00+08:00'));

export function toMember(row: Raw): Member {
  const name = text(row, ['Nama', 'NamaMember', 'NamaLengkap', 'Name'], 'Member Beauty');
  const kode = text(row, ['Kode', 'KodeMember', 'MemberCode']);
  const card = text(row, ['NoKartu', 'NomorKartu', 'KartuMember', 'NoMember', 'Kode'], kode);
  const expiresIso = isoDate(pick(row, ['TglBerakhir', 'TanggalBerakhir', 'ExpiredDate']));
  const joinIso = isoDate(pick(row, ['TglDaftar', 'TanggalDaftar', 'TglGabung', 'CreatedDate']));

  return {
    kode,
    name,
    firstName: name.split(/\s+/)[0] || name,
    card,
    phone: text(row, ['NoHP', 'NoHp', 'Handphone', 'Telepon', 'Phone']),
    tier: text(row, ['JMember', 'JenisMember', 'Tier', 'Grade'], 'MEMBER').toUpperCase(),
    points: money(row, ['PointAkhir', 'PoinAkhir', 'SaldoPoint', 'Point']),
    expires: expiresIso ? longDate(expiresIso) : null,
    since: joinIso ? joinIso.slice(0, 4) : null,
  };
}

export function toTransaction(row: Raw, index: number): Transaction {
  const points = money(row, ['Point', 'Poin', 'JumlahPoint', 'NilaiPoint']);
  const amount = money(row, ['Nominal', 'Total', 'TotalBelanja', 'Jumlah', 'Bruto']);
  const date = isoDate(pick(row, ['Tanggal', 'TglTransaksi', 'TanggalTransaksi', 'Date']));
  const note = text(row, ['Keterangan', 'Deskripsi', 'Ket', 'Description']);

  return {
    id: text(row, ['NoTransaksi', 'NoBukti', 'Kode', 'Id'], `TRX-${index}`),
    date: date ?? '',
    title: note || (points < 0 ? 'Penukaran poin di kasir' : 'Belanja di Beauty Kendari'),
    outlet: text(row, ['Outlet', 'NamaOutlet', 'Cabang', 'Store'], 'Beauty Kendari'),
    amount,
    points,
  };
}
