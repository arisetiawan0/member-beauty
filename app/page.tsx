import { BeautyApp } from '@/components/beauty-app';
import { loadMemberData } from '@/lib/load';

// Member data is per-request and must never be prerendered or shared.
export const dynamic = 'force-dynamic';
export default async function Page() { return <BeautyApp page="home" data={await loadMemberData()} />; }
