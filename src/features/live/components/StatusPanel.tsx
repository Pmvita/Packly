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
  const pulseState = getPulseState(statusLabel, connected);

  return (
    <div className="panel px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="status-pulse" data-state={pulseState} />
            <span className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--fog)]/65">
              {connected ? 'Realtime stream connected' : 'Offline'}
            </span>
          </div>
          <h2 className="mt-2 font-display text-xl font-semibold text-[#e8fff7]">
            Capture control
          </h2>
          <p className="text-sm text-[var(--fog)]/70">
            Configure interface, update filters, and manage capture sessions.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start border border-[var(--line)] bg-[var(--ink)] px-3 py-1.5 font-data text-[10px] font-medium uppercase tracking-[0.14em] text-[#e8fff7]">
          <span className="status-pulse" data-state={pulseState} />
          <span>{statusLabel}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <label className="flex flex-col gap-1 text-sm text-[var(--fog)]">
            Interface
            <div className="flex gap-2">
              <select
                className="ink-input"
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
                className="btn-ghost !px-3 !py-2 text-xs uppercase tracking-wide"
                disabled={interfacesLoading}
              >
                Refresh
              </button>
            </div>
            {interfacesError ? (
              <span className="text-xs text-[var(--signal)]">
                {interfacesError.message}
              </span>
            ) : (
              <span className="text-xs text-[var(--fog)]/55">
                {interfacesLoading
                  ? 'Loading interfaces...'
                  : interfaces.length
                    ? 'Select the NIC to sniff traffic from.'
                    : 'No interfaces detected.'}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm text-[var(--fog)]">
            BPF filter
            <input
              className="ink-input font-data"
              value={filter}
              onChange={(event) => onFilterChange(event.target.value)}
              placeholder="tcp port 80"
            />
            <span className="text-xs text-[var(--fog)]/55">
              e.g. <code className="text-[var(--phosphor)]">tcp port 443</code> or{' '}
              <code className="text-[var(--phosphor)]">icmp</code>
            </span>
          </label>

          <label className="flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.12em] text-[var(--fog)]/70">
            <input
              type="checkbox"
              checked={useMock}
              onChange={(event) => onToggleMock(event.target.checked)}
              className="h-4 w-4 accent-[var(--phosphor)]"
            />
            Use mock capture (default on Windows — Npcap is optional)
          </label>
        </div>
        <div className="space-y-4 lg:col-span-7">
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
              className="btn-phosphor"
            >
              {isStarting ? 'Starting…' : 'Start capture'}
            </button>
            <button
              type="button"
              onClick={onStopCapture}
              disabled={isStopping}
              className="btn-ghost"
            >
              {isStopping ? 'Stopping…' : 'Stop capture'}
            </button>
            <span className="font-data text-[10px] text-[var(--fog)]/55">
              Capture path:{' '}
              <code className="text-[var(--phosphor)]">
                {process.env.NEXT_PUBLIC_SOCKET_PATH ?? '/api/socket'}
              </code>
            </span>
          </div>

          {lastError && (
            <div className="border border-[rgba(255,92,92,0.45)] bg-[rgba(255,92,92,0.08)] px-3 py-2 text-xs text-[var(--signal)]">
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
    <div className="surface p-3">
      <span className="font-data text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--fog)]/55">
        {label}
      </span>
      <p className="mt-1 font-data text-lg font-semibold tabular-nums text-[#e8fff7]">
        {value}
      </p>
    </div>
  );
}

function getPulseState(status: string, connected: boolean) {
  if (status === 'running') return 'online';
  if (status === 'starting' || status === 'stopping') return 'warn';
  if (!connected) return 'offline';
  return 'offline';
}
