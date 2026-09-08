import { Brand } from '@/components/beauty-app';

/** Explicit loading state for every member page fetch (PRD §6.1). */
export default function Loading() {
  return (
    <div className="boot-screen" role="status" aria-live="polite">
      <Brand />
      <div className="boot-bar"><span /></div>
      <p>Mengambil data membermu…</p>
    </div>
  );
}
