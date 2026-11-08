'use client';

import { useQuery } from '@tanstack/react-query';

interface Session {
  id: string;
  name: string | null;
  device: string;
  filter: string;
  mode: string;
  lifecycle: string;
  startedAt: string;
  endedAt: string | null;
  packetCount: number;
  byteCount: string;
  flowCount: number;
}

export default function HistoryPage() {
  const { data, isLoading } = useQuery<{ sessions: Session[] }>({
    queryKey: ['capture-history'],
    queryFn: async () => {
      const res = await fetch('/api/capture/history');
      if (!res.ok) throw new Error('Failed to load history');
      return res.json();
    },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 text-slate-100">
      <h1 className="mb-6 text-2xl font-semibold">Capture history</h1>
      {isLoading && <p>Loading…</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="py-2">Session</th>
              <th className="py-2">Device</th>
              <th className="py-2">Mode</th>
              <th className="py-2">Lifecycle</th>
              <th className="py-2">Started</th>
              <th className="py-2">Packets</th>
            </tr>
          </thead>
          <tbody>
            {(data?.sessions ?? []).map((s) => (
              <tr key={s.id} className="border-b border-slate-800">
                <td className="py-2">{s.name ?? s.id}</td>
                <td className="py-2">{s.device}</td>
                <td className="py-2">{s.mode}</td>
                <td className="py-2">{s.lifecycle}</td>
                <td className="py-2">{new Date(s.startedAt).toLocaleString()}</td>
                <td className="py-2">{s.packetCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isLoading && (data?.sessions?.length ?? 0) === 0 && (
        <p className="mt-4 text-slate-400">No captured sessions yet.</p>
      )}
    </main>
  );
}
