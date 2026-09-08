import { Login } from '@/components/beauty-app';
import { demoMode } from '@/lib/affari/client';
import * as demo from '@/lib/demo';

const NOTICES: Record<string, string> = {
  sesi: 'Sesi kamu sudah berakhir. Masuk lagi dengan nomor HP atau nomor kartu.',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ alasan?: string }> }) {
  const { alasan } = await searchParams;
  const isDemo = demoMode();
  return <Login demo={isDemo} notice={alasan ? NOTICES[alasan] : undefined} sample={isDemo ? demo.member : undefined} />;
}
