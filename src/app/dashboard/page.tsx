import { LiveDashboard } from '@/features/live/LiveDashboard';

export const metadata = {
  title: 'Dashboard — Packly',
  description: 'Live packet capture, protocol breakdown, and diagnostic reports.',
};

export default function DashboardPage() {
  return <LiveDashboard />;
}
