import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata = {
  title: 'Terms of Service — Packly',
  description: 'Terms governing use of Packly.',
};

export default function TermsPage() {
  return (
    <main className="radar-atmosphere min-h-screen text-[var(--fog)]">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-[#e8fff7]">
          Terms & Conditions
        </h1>
        <p className="mt-4 text-[var(--fog)]/80">
          Packly is provided as-is for network analysis. You are responsible for
          ensuring you have authorization to capture traffic on any network. Live
          capture requires host privileges; do not use on networks you do not own
          or have permission to monitor.
        </p>
        <Link href="/" className="link-phosphor mt-8 inline-block text-sm">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
