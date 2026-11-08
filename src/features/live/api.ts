import type { CaptureManagerState } from '@/server/capture/manager';
import { authHeaders } from './auth-storage';

export interface CaptureInterfaceAddress {
  address?: string;
  netmask?: string;
  family?: string;
  broadcast?: string;
}

export interface CaptureInterface {
  name: string;
  description?: string;
  addresses: CaptureInterfaceAddress[];
}

export interface StartCaptureRequest {
  device: string;
  filter?: string;
  useMock?: boolean;
  snapLength?: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMessage =
      (data as { error?: string; details?: string }).error ??
      `${response.status} ${response.statusText}`;
    const details = (data as { details?: string }).details;
    throw new Error(details ? `${errorMessage}: ${details}` : errorMessage);
  }
  return response.json() as Promise<T>;
}

export async function fetchAuthStatus(): Promise<{ required: boolean }> {
  const response = await fetch('/api/capture/auth-status', {
    cache: 'no-store',
  });
  return handleResponse(response);
}

export async function fetchCaptureStatus(): Promise<CaptureManagerState> {
  const response = await fetch('/api/capture/status', { cache: 'no-store' });
  return handleResponse(response);
}

export async function fetchCaptureInterfaces(): Promise<CaptureInterface[]> {
  const response = await fetch('/api/capture/interfaces', {
    cache: 'no-store',
  });
  const data = await handleResponse<{ interfaces: CaptureInterface[] }>(
    response
  );
  return data.interfaces;
}

export async function startCapture(
  payload: StartCaptureRequest
): Promise<CaptureManagerState> {
  const response = await fetch('/api/capture/start', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function stopCapture(): Promise<CaptureManagerState> {
  const response = await fetch('/api/capture/stop', {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(response);
}

export async function fetchCaptureHistory(): Promise<{
  sessions: Array<{
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
  }>;
}> {
  const response = await fetch('/api/capture/history', {
    cache: 'no-store',
    headers: authHeaders(),
  });
  return handleResponse(response);
}

export async function fetchCaptureSession(id: string): Promise<{
  session: {
    id: string;
    name: string | null;
    device: string;
    filter: string;
    mode: string;
    lifecycle: string;
    errorMessage: string | null;
    startedAt: string;
    endedAt: string | null;
    packetCount: number;
    byteCount: string;
    flowCount: number;
    packets: Array<{
      id: string;
      capturedAt: string;
      protocol: string;
      srcAddr: string | null;
      dstAddr: string | null;
      srcPort: number | null;
      dstPort: number | null;
      capturedLength: number;
      originalLength: number;
      tcpFlags: unknown;
    }>;
    flows: Array<{
      id: string;
      protocol: string;
      srcAddr: string;
      dstAddr: string;
      srcPort: number | null;
      dstPort: number | null;
      packetCount: number;
      byteCount: string;
      firstSeenAt: string;
      lastSeenAt: string;
    }>;
  };
}> {
  const response = await fetch(`/api/capture/history/${id}`, {
    cache: 'no-store',
    headers: authHeaders(),
  });
  return handleResponse(response);
}

export interface PlaybackResponse {
  packetCount: number;
  packets: import('@/capture/types').PacketSummary[];
  markdown: string;
  report: {
    packetCount: number;
    protocolCounts: Record<string, number>;
    summary: string;
    findings: Array<{
      check: string;
      severity: string;
      detail: string;
    }>;
  };
}

export async function fetchSamplePlayback(): Promise<PlaybackResponse> {
  const response = await fetch('/api/capture/playback', { cache: 'no-store' });
  return handleResponse(response);
}

export async function uploadPcapPlayback(
  file: File
): Promise<PlaybackResponse> {
  const response = await fetch('/api/capture/playback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.tcpdump.pcap' },
    body: file,
  });
  return handleResponse(response);
}
