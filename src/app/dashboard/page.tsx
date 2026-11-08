import { LiveDashboard } from '@/features/live/LiveDashboard';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata = {
  title: 'Dashboard — Packly',
  description: 'Live packet capture, protocol breakdown, and diagnostic reports.',
};

export default function DashboardPage() {
  return (
    <main className="radar-atmosphere min-h-screen text-[var(--fog)]">
      <SiteHeader current="dashboard" />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#e8fff7]">
            Capture dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--fog)]/75">
            Live packets, protocol breakdown, diagnostic report.
          </p>
        </div>
        <LiveDashboard />
      </div>
    </main>
  );
}
