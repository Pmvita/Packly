'use client';

import type { CaptureManagerState } from '@/server/capture/manager';
import type { CaptureInterface } from '../api';

interface StatusPanelProps {
  connected: boolean;
  status: CaptureManagerState | null;
  interfaces: CaptureInterface[];
  interfacesLoading: boolean;
  interfacesError: Error | null;
  selectedInterface: string;
  onSelectInterface: (value: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
  onRefreshInterfaces: () => void;
  onStartCapture: () => void;
  onStopCapture: () => void;
  isStarting: boolean;
  isStopping: boolean;
  packetsCaptured: number;
  useMock: boolean;
  onToggleMock: (value: boolean) => void;
  lastError: string | null;
}

export function StatusPanel({
  connected,
  status,
  interfaces,
  interfacesLoading,
  interfacesError,
  selectedInterface,
  onSelectInterface,
  filter,
  onFilterChange,
  onRefreshInterfaces,
  onStartCapture,
  onStopCapture,
  isStarting,
  isStopping,
  packetsCaptured,
  useMock,
  onToggleMock,
  lastError,
}: StatusPanelProps) {
  const statusLabel = status ? status.status : 'idle';
  const statusColor = getStatusColor(statusLabel);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-500'} ${connected ? 'animate-pulse' : ''}`}
            />
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {connected ? 'Realtime stream connected' : 'Offline'}
            </span>
          </div>
          <h2 className="mt-1.5 text-xl font-semibold text-slate-100">
            Capture control
          </h2>
          <p className="text-sm text-slate-400">
            Configure interface, update filters, and manage capture sessions.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-200">
          <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
          <span className="uppercase tracking-wider">{statusLabel}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-3">
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Interface
            <div className="flex gap-2">
              <select
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                value={selectedInterface}
                onChange={(event) => onSelectInterface(event.target.value)}
                disabled={interfacesLoading}
              >
                {interfaces.map((networkInterface) => (
                  <option key={networkInterface.name} value={networkInterface.name}>
                    {networkInterface.name}{' '}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onRefreshInterfaces}
                className="rounded-md border border-slate-700 px-3 text-xs font-medium uppercase tracking-wide text-slate-200 transition hover:border-slate-500"
                disabled={interfacesLoading}
              >
                Refresh
              </button>
            </div>
            {interfacesError ? (
              <span className="text-xs text-rose-400">
                {interfacesError.message}
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                {interfacesLoading
                  ? 'Loading interfaces...'
                  : interfaces.length
                    ? 'Select the NIC to sniff traffic from.'
                    : 'No interfaces detected.'}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-300">
            BPF filter
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              value={filter}
              onChange={(event) => onFilterChange(event.target.value)}
              placeholder="tcp port 80"
            />
            <span className="text-xs text-slate-500">
              e.g. <code className="text-emerald-300">tcp port 443</code> or{' '}
              <code className="text-emerald-300">icmp</code>
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <input
              type="checkbox"
              checked={useMock}
              onChange={(event) => onToggleMock(event.target.checked)}
              className="h-4 w-4 rounded border-slate-600 text-emerald-400 focus:ring-emerald-400"
            />
            Use mock capture (default on Windows — Npcap is optional)
          </label>
        </div>
        <div className="lg:col-span-7 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Packets captured"
              value={packetsCaptured.toLocaleString()}
            />
            <MetricCard
              label="Mode"
              value={(status?.mode ?? 'unknown').toUpperCase()}
            />
            <MetricCard
              label="Last packet"
              value={
                status?.metrics.lastPacketAt
                  ? new Date(status.metrics.lastPacketAt).toLocaleTimeString()
                  : '—'
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onStartCapture}
              disabled={isStarting || (!useMock && !selectedInterface)}
              className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/40 disabled:text-emerald-200"
            >
              {isStarting ? 'Starting…' : 'Start capture'}
            </button>
            <button
              type="button"
              onClick={onStopCapture}
              disabled={isStopping}
              className="inline-flex items-center rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
            >
              {isStopping ? 'Stopping…' : 'Stop capture'}
            </button>
            <span className="text-xs text-slate-500">
              Capture path:{' '}
              <code className="font-mono text-emerald-300">
                {process.env.NEXT_PUBLIC_SOCKET_PATH ?? '/api/socket'}
              </code>
            </span>
          </div>

          {lastError && (
            <div className="rounded-md border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {lastError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-950 p-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <p className="mt-1 text-lg font-semibold text-slate-100 tabular-nums">{value}</p>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'running':
      return 'bg-emerald-400';
    case 'starting':
    case 'stopping':
      return 'bg-amber-400';
    case 'stopped':
    case 'idle':
      return 'bg-slate-600';
    default:
      return 'bg-slate-500';
  }
}

