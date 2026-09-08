/**
 * Sample member used when AFFARI_TOKEN is absent, so the app is runnable
 * without credentials. Never used once the token is configured.
 */
import type { Member, Transaction } from '@/lib/types';

export const member: Member = {
  kode: 'DEMO-0001',
  name: 'Nabila Putri',
  firstName: 'Nabila',
  card: 'BK000082716',
  phone: '081234567890',
  tier: 'GOLD',
  points: 2480,
  expires: '31 Desember 2026',
  since: '2024',
};

export const transactions: Transaction[] = [
  { id: 'TRX-0926-0187', date: '2026-09-05', title: 'Belanja di Beauty Kendari', outlet: 'Outlet Kendari', amount: 325000, points: 325 },
  { id: 'TRX-0926-0102', date: '2026-09-02', title: 'Penukaran poin di kasir', outlet: 'Outlet Kendari', amount: 0, points: -500 },
  { id: 'TRX-0826-0721', date: '2026-08-28', title: 'Belanja di Beauty Kendari', outlet: 'Outlet Kendari', amount: 185000, points: 185 },
  { id: 'TRX-0826-0593', date: '2026-08-21', title: 'Belanja di Beauty Kendari', outlet: 'Outlet Kendari', amount: 460000, points: 460 },
  { id: 'TRX-0826-0331', date: '2026-08-14', title: 'Penukaran poin di kasir', outlet: 'Outlet Kendari', amount: 0, points: -250 },
  { id: 'TRX-0826-0142', date: '2026-08-06', title: 'Belanja di Beauty Kendari', outlet: 'Outlet Kendari', amount: 275000, points: 275 },
  { id: 'TRX-0726-0831', date: '2026-07-24', title: 'Belanja di Beauty Kendari', outlet: 'Outlet Kendari', amount: 390000, points: 390 },
];
