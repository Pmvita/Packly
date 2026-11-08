'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchAuthStatus, fetchCaptureHistory } from '@/features/live/api';
import { ApiKeyField } from '@/features/live/components/ApiKeyField';
import { SiteHeader } from '@/components/SiteHeader';

export default function HistoryPage() {
  const authQuery = useQuery({
    queryKey: ['auth-status'],
    queryFn: fetchAuthStatus,
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['capture-history'],
    queryFn: fetchCaptureHistory,
  });

  return (
    <main className="radar-atmosphere min-h-screen text-[var(--fog)]">
      <SiteHeader current="history" />

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#e8fff7]">
              Capture history
            </h1>
            <p className="mt-1 text-sm text-[var(--fog)]/75">
              Sessions scoped to your API key when auth is enabled.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="btn-ghost !px-3 !py-1.5 text-sm"
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div className="mb-6 max-w-md">
          <ApiKeyField required={authQuery.data?.required ?? false} />
        </div>

        {isLoading && (
          <p className="font-data text-sm text-[var(--fog)]/60">Loading…</p>
        )}
        {error && (
          <p className="mb-4 text-sm text-[var(--signal)]">
            {(error as Error).message}
          </p>
        )}

        <div className="panel overflow-x-auto">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Device</th>
                <th>Mode</th>
                <th>Lifecycle</th>
                <th>Started</th>
                <th>Packets</th>
              </tr>
            </thead>
            <tbody>
              {(data?.sessions ?? []).map((s, index) => (
                <tr
                  key={s.id}
                  className="row-enter"
                  style={{ animationDelay: `${Math.min(index, 16) * 24}ms` }}
                >
                  <td>
                    <Link
                      href={`/history/${s.id}`}
                      className="link-phosphor text-[var(--phosphor)]"
                    >
                      {s.name ?? s.id.slice(0, 10)}
                    </Link>
                  </td>
                  <td>{s.device}</td>
                  <td className="uppercase">{s.mode}</td>
                  <td className="uppercase">{s.lifecycle}</td>
                  <td>{new Date(s.startedAt).toLocaleString()}</td>
                  <td>{s.packetCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && (data?.sessions?.length ?? 0) === 0 && (
          <p className="mt-4 text-sm text-[var(--fog)]/60">
            No captured sessions yet.
          </p>
        )}
      </div>
    </main>
  );
}
