import Link from 'next/link';
import { LiveDashboard } from '@/features/live/LiveDashboard';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950 pb-16">
      <section className="border-b border-slate-800 bg-slate-950 px-6 pb-12 pt-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 text-slate-100">
          <div className="flex items-center justify-between">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Packly
            </span>
            <nav className="flex gap-6 text-sm text-slate-300">
                          <Link href="/" className="transition hover:text-emerald-300">Dashboard</Link>
                          <Link href="/history" className="transition hover:text-emerald-300">History</Link>
                        </nav>
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Deep visibility into your network traffic.
          </h1>
          <p className="max-w-2xl text-lg text-slate-400">
            Start a capture, stream packets in real-time, and persist flows for historical analysis — all from a single Next.js dashboard.
          </p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl px-6 pt-8">
        <div className="grid gap-6">
          <LiveDashboard />
        </div>
      </section>
    </main>
  );
}
