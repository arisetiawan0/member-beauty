'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowClockwise, WarningCircle } from '@phosphor-icons/react';

import { Brand } from '@/components/beauty-app';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  useEffect(() => { console.error('[beauty] page failed:', error); }, [error]);

  // reset() alone replays the cached server render, so the refresh has to come
  // first — otherwise the retry button can never recover from an upstream blip.
  function retry() {
    startRetry(() => { router.refresh(); reset(); });
  }

  return (
    <div className="boot-screen">
      <Brand />
      <span className="boot-icon"><WarningCircle size={34} /></span>
      <h1>Gagal terhubung ke server</h1>
      <p>Data membermu tidak bisa diambil sekarang. Periksa koneksi internetmu, lalu coba lagi.</p>
      <button className="button primary" onClick={retry} disabled={retrying}>
        <ArrowClockwise size={18} />{retrying ? 'Mencoba lagi…' : 'Coba lagi'}
      </button>
      <a className="text-link" href="/login">Masuk dengan nomor lain</a>
    </div>
  );
}
