import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata = {
  title: 'Privacy Policy — Packly',
  description: 'How Packly handles captured packet data.',
};

export default function PrivacyPage() {
  return (
    <main className="radar-atmosphere min-h-screen text-[var(--fog)]">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-[#e8fff7]">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[var(--fog)]/80">
          Packly processes packet data on the host running the capture engine.
          No data is sold or shared with third parties. Captured payloads may be
          retained according to your configured TTL (default 30 days); raw
          payloads are cleared after 24 hours. You control your database and
          retention.
        </p>
        <p className="mt-4 text-[var(--fog)]/80">
          Contact: Petermvita@hotmail.com
        </p>
        <Link href="/" className="link-phosphor mt-8 inline-block text-sm">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
