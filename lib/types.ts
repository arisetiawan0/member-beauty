export type Member = {
  /** Primary key at Affari. Stored in the session cookie. */
  kode: string;
  name: string;
  firstName: string;
  card: string;
  phone: string;
  tier: string;
  points: number;
  /** Formatted card expiry, or null when Affari sends nothing usable. */
  expires: string | null;
  /** Join year, or null when unknown / masked by the 1900 sentinel. */
  since: string | null;
};

export type Transaction = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  outlet: string;
  /** Rupiah spent. 0 for redemptions. */
  amount: number;
  /** Positive = earned, negative = redeemed. */
  points: number;
};

/** Distinct failures the UI must word differently (PRD §6.1). */
export type FailureKind = 'not-found' | 'upstream' | 'config';

export class AffariError extends Error {
  constructor(
    readonly kind: FailureKind,
    message: string,
    readonly detail?: string,
  ) {
    super(message);
    this.name = 'AffariError';
  }
}

export const failureMessage: Record<FailureKind, string> = {
  'not-found': 'Nomor tidak ditemukan. Pastikan nomor benar atau hubungi outlet terdekat.',
  upstream: 'Gagal terhubung ke server Beauty Kendari. Coba lagi sebentar lagi.',
  config: 'Aplikasi belum dikonfigurasi untuk menghubungi server member.',
};
