import Link from 'next/link';
import { LiveDashboard } from '@/features/live/LiveDashboard';

export const metadata = {
  title: 'Dashboard — Packly',
  description: 'Live packet capture, protocol breakdown, and diagnostic reports.',
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Packly
          </Link>
          <nav className="flex gap-6 text-sm text-slate-300">
            <Link href="/" className="transition hover:text-emerald-300">Home</Link>
            <Link href="/history" className="transition hover:text-emerald-300">History</Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Capture dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Live packets, protocol breakdown, diagnostic report.</p>
        <div className="mt-6">
          <LiveDashboard />
        </div>
      </div>
    </main>
  );
}

