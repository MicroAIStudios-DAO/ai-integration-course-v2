import './globals.css';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const AuthBar = dynamic(() => import('@/components/AuthBar'), { ssr: false });
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Allie Course',
  description: 'Free & premium lessons with video and Stripe gating',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="/">Allie</Link>
            <span style={{ flex: 1 }} />
            <AuthBar />
            <Link href="/account">Account</Link>
          </nav>
        </header>
        <main style={{ padding: '1rem', maxWidth: 900, margin: '0 auto' }}>{children}</main>
      </body>
    </html>
  );
}
