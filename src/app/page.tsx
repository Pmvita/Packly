import { LiveDashboard } from '@/features/live/LiveDashboard';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-950 pb-16">
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 px-6 pb-10 pt-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-slate-100">
          <span className="inline-flex w-fit rounded-full border border-slate-700/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300/80">
            Packly
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Deep visibility into your network traffic.
          </h1>
          <p className="max-w-3xl text-base text-slate-300 sm:text-lg">
            Start a capture, stream packets in real-time, and persist flows for
            historical analysis — all from a single Next.js dashboard.
          </p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-6">
          <LiveDashboard />
        </div>
      </section>
    </main>
  );
}
