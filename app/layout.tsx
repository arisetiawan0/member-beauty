import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
export const metadata: Metadata = { title: 'Beauty Kendari | Ruang cantikmu', description: 'Kartu member digital, saldo poin, dan riwayat belanjamu dalam satu tempat. Frontend demo Beauty Kendari.', applicationName: 'Beauty Kendari', appleWebApp: { capable: true, title: 'Beauty Kendari', statusBarStyle: 'default' }, icons: { icon: '/icon-192.png', apple: '/icon-192.png' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FE3E9F' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="id" suppressHydrationWarning><body className={jakarta.variable}>{children}</body></html>; }
