'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchAuthStatus, fetchCaptureSession } from '@/features/live/api';
import { ApiKeyField } from '@/features/live/components/ApiKeyField';
import { SiteHeader } from '@/components/SiteHeader';

export default function HistorySessionPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const authQuery = useQuery({
    queryKey: ['auth-status'],
    queryFn: fetchAuthStatus,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['capture-session', id],
    queryFn: () => fetchCaptureSession(id),
    enabled: Boolean(id),
  });

  const session = data?.session;

  return (
    <main className="radar-atmosphere min-h-screen text-[var(--fog)]">
      <SiteHeader current="history" />

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--fog)]/55">
              Session detail
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#e8fff7]">
              {session?.name ?? session?.id ?? id}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/history" className="btn-ghost !px-3 !py-1.5">
              ← All sessions
            </Link>
            <Link href="/dashboard" className="btn-phosphor !px-3 !py-1.5">
              Open playback dashboard
            </Link>
          </div>
        </div>

        <div className="mb-6 max-w-md">
          <ApiKeyField required={authQuery.data?.required ?? false} />
        </div>

        {isLoading && (
          <p className="font-data text-sm text-[var(--fog)]/60">
            Loading session…
          </p>
        )}
        {error && (
          <p className="text-sm text-[var(--signal)]">
            {(error as Error).message}
          </p>
        )}

        {session && (
          <div className="grid gap-8">
            <section className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Meta label="Device" value={session.device} />
              <Meta label="Mode" value={session.mode} />
              <Meta label="Lifecycle" value={session.lifecycle} />
              <Meta label="Filter" value={session.filter || '(none)'} />
              <Meta
                label="Started"
                value={new Date(session.startedAt).toLocaleString()}
              />
              <Meta
                label="Ended"
                value={
                  session.endedAt
                    ? new Date(session.endedAt).toLocaleString()
                    : '—'
                }
              />
              <Meta label="Packets" value={String(session.packetCount)} />
              <Meta label="Flows" value={String(session.flowCount)} />
            </section>

            {session.errorMessage && (
              <p className="border border-[rgba(255,92,92,0.4)] bg-[rgba(255,92,92,0.08)] px-3 py-2 text-sm text-[var(--signal)]">
                {session.errorMessage}
              </p>
            )}

            <section className="panel p-4">
              <h2 className="mb-3 font-display text-lg font-medium text-[#e8fff7]">
                Flows
              </h2>
              <div className="overflow-x-auto">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Proto</th>
                      <th>Source</th>
                      <th>Destination</th>
                      <th>Packets</th>
                      <th>Bytes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.flows.map((flow, index) => (
                      <tr
                        key={flow.id}
                        className="row-enter"
                        style={{
                          animationDelay: `${Math.min(index, 16) * 24}ms`,
                        }}
                      >
                        <td className="uppercase">{flow.protocol}</td>
                        <td>
                          {flow.srcAddr}
                          {flow.srcPort != null ? `:${flow.srcPort}` : ''}
                        </td>
                        <td>
                          {flow.dstAddr}
                          {flow.dstPort != null ? `:${flow.dstPort}` : ''}
                        </td>
                        <td>{flow.packetCount}</td>
                        <td>{flow.byteCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {session.flows.length === 0 && (
                  <p className="mt-2 text-sm text-[var(--fog)]/55">
                    No flows recorded.
                  </p>
                )}
              </div>
            </section>

            <section className="panel p-4">
              <h2 className="mb-3 font-display text-lg font-medium text-[#e8fff7]">
                Packets{' '}
                <span className="font-data text-sm font-normal text-[var(--fog)]/55">
                  (up to 200)
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Proto</th>
                      <th>Source</th>
                      <th>Destination</th>
                      <th>Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.packets.map((pkt, index) => (
                      <tr
                        key={pkt.id}
                        className="row-enter"
                        style={{
                          animationDelay: `${Math.min(index, 20) * 18}ms`,
                        }}
                      >
                        <td className="whitespace-nowrap text-[var(--fog)]/70">
                          {new Date(pkt.capturedAt).toLocaleTimeString()}
                        </td>
                        <td className="uppercase">{pkt.protocol}</td>
                        <td>
                          {pkt.srcAddr ?? '—'}
                          {pkt.srcPort != null ? `:${pkt.srcPort}` : ''}
                        </td>
                        <td>
                          {pkt.dstAddr ?? '—'}
                          {pkt.dstPort != null ? `:${pkt.dstPort}` : ''}
                        </td>
                        <td>{pkt.capturedLength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {session.packets.length === 0 && (
                  <p className="mt-2 text-sm text-[var(--fog)]/55">
                    No packets recorded.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface px-3 py-2">
      <div className="font-data text-[10px] uppercase tracking-[0.12em] text-[var(--fog)]/55">
        {label}
      </div>
      <div className="mt-0.5 truncate font-data text-sm text-[#e8fff7]">
        {value}
      </div>
    </div>
  );
}
