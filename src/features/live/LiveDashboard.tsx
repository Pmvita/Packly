'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCaptureInterfaces,
  fetchCaptureStatus,
  fetchSamplePlayback,
  startCapture,
  stopCapture,
  uploadPcapPlayback,
} from './api';
import { useLiveStore } from './state/useLiveStore';
import { StatusPanel } from './components/StatusPanel';
import { PacketTable } from './components/PacketTable';
import { ProtocolChart } from './components/ProtocolChart';
import { DiagnosticPanel } from './components/DiagnosticPanel';
import type { PacketSummary } from '@/capture/types';

const DEFAULT_INTERFACE = process.env.NEXT_PUBLIC_DEFAULT_INTERFACE ?? '';

export function LiveDashboard() {
  const queryClient = useQueryClient();
  const status = useLiveStore((state) => state.status);
  const connected = useLiveStore((state) => state.connected);
  const packets = useLiveStore((state) => state.packets);
  const lastError = useLiveStore((state) => state.lastError);
  const setStatus = useLiveStore((state) => state.setStatus);
  const setLastError = useLiveStore((state) => state.setLastError);
  const setPackets = useLiveStore((state) => state.setPackets);

  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [filter, setFilter] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_FILTER ?? 'tcp'
  );
  const [useMock, setUseMock] = useState(true);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const interfacesQuery = useQuery({
      queryKey: ['capture-interfaces'],
      queryFn: fetchCaptureInterfaces,
    });

    useEffect(() => {
      if (interfacesQuery.data) {
        setSelectedInterface((current) => {
          if (current) return current;
          return (
            interfacesQuery.data.find((item) => item.name === DEFAULT_INTERFACE)
              ?.name ??
            interfacesQuery.data[0]?.name ??
            ''
          );
        });
      }
    }, [interfacesQuery.data]);

    const statusQuery = useQuery({
      queryKey: ['capture-status'],
      queryFn: fetchCaptureStatus,
      enabled: !status,
    });

    useEffect(() => {
      if (statusQuery.data) setStatus(statusQuery.data);
    }, [statusQuery.data, setStatus]);

  const startMutation = useMutation({
    mutationFn: startCapture,
    onSuccess: (data) => {
      setStatus(data);
      setLastError(null);
      queryClient.invalidateQueries({ queryKey: ['capture-status'] });
    },
    onError: (error: unknown) => {
      setLastError((error as Error).message ?? 'Failed to start capture');
    },
  });

  const stopMutation = useMutation({
    mutationFn: stopCapture,
    onSuccess: (data) => {
      setStatus(data);
      queryClient.invalidateQueries({ queryKey: ['capture-status'] });
    },
    onError: (error: unknown) => {
      setLastError((error as Error).message ?? 'Failed to stop capture');
    },
  });

  const protocolSummary = useMemo(() => {
    const counts = packets.reduce<Record<string, number>>((acc, packet) => {
      const protocol = packet.transport?.protocol ?? 'unknown';
      acc[protocol] = (acc[protocol] ?? 0) + 1;
      return acc;
    }, {});
    const total = packets.length || 1;
    return Object.entries(counts)
      .map(([protocol, count]) => ({
        protocol,
        percentage: Math.round((count / total) * 100),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [packets]);

  const handleStartCapture = () => {
    const device = useMock ? selectedInterface || 'mock0' : selectedInterface;
    if (!device) {
      setLastError('Select a network interface to start capturing.');
      return;
    }
    startMutation.mutate({
      device,
      filter,
      useMock,
    });
  };

  const handleStopCapture = () => {
    stopMutation.mutate();
  };

  const applyPlayback = async (loader: () => ReturnType<typeof fetchSamplePlayback>) => {
    setIsPlayingSample(true);
    try {
      const playback = await loader();
      setPackets(playback.packets);
      setLastError(null);
    } catch (error) {
      setLastError((error as Error).message ?? 'Failed to load pcap');
    } finally {
      setIsPlayingSample(false);
    }
  };

  const handlePlaySample = () => {
    void applyPlayback(fetchSamplePlayback);
  };

  const handleUploadPcap = (file: File) => {
    void applyPlayback(() => uploadPcapPlayback(file));
  };

  return (
    <div className="grid gap-6">
      <StatusPanel
        connected={connected}
        status={status}
        interfaces={interfacesQuery.data ?? []}
        interfacesLoading={interfacesQuery.isLoading}
        interfacesError={interfacesQuery.error as Error | null}
        selectedInterface={selectedInterface}
        onSelectInterface={setSelectedInterface}
        filter={filter}
        onFilterChange={setFilter}
        onRefreshInterfaces={() =>
          queryClient.invalidateQueries({ queryKey: ['capture-interfaces'] })
        }
        onStartCapture={handleStartCapture}
        onStopCapture={handleStopCapture}
        isStarting={startMutation.isPending}
        isStopping={stopMutation.isPending}
        packetsCaptured={status?.metrics.totalPackets ?? 0}
        useMock={useMock}
        onToggleMock={setUseMock}
        lastError={lastError}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PacketTable packets={packets.slice(-50)} />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <ProtocolChart protocols={protocolSummary} />
          <DiagnosticPanel
            packets={packets}
            isPlayingSample={isPlayingSample}
            onPlaySample={handlePlaySample}
            onUploadPcap={handleUploadPcap}
          />
          <LatencyCard packets={packets} />
        </div>
      </div>
    </div>
  );
}

interface LatencyCardProps {
  packets: PacketSummary[];
}

function LatencyCard({ packets }: LatencyCardProps) {
  const latest = packets[packets.length - 1];
  const timings = useMemo(() => {
    if (packets.length < 2) return null;
    const window = packets.slice(-20);
    const first = window[0];
    const last = window[window.length - 1];
    const durationMs = last.timestampMs - first.timestampMs;
    const rate =
      durationMs > 0 ? (window.length / durationMs) * 1000 : window.length;
    return {
      durationMs,
      rate,
    };
  }, [packets]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Recent activity
        </h3>
        <span className="text-xs text-slate-500">
          {latest
            ? new Date(latest.timestampMs).toLocaleTimeString()
            : '—'}
        </span>
      </div>
      <div className="mt-4 grid gap-4">
        <MetricRow
          label="Packets (last 50)"
          value={packets.slice(-50).length.toString()}
        />
        <MetricRow
          label="Window rate"
          value={
            timings
              ? `${timings.rate.toFixed(1)} pkt/s`
              : packets.length
                ? 'Collecting...'
                : '—'
          }
        />
        <MetricRow
          label="Window span"
          value={
            timings
              ? `${timings.durationMs.toFixed(0)} ms`
              : packets.length
                ? 'Collecting...'
                : '—'
          }
        />
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-100">{value}</span>
    </div>
  );
}

