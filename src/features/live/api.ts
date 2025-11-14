import type { CaptureManagerState } from '@/server/capture/manager';

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
      (data as { error?: string }).error ??
      `${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function stopCapture(): Promise<CaptureManagerState> {
  const response = await fetch('/api/capture/stop', {
    method: 'POST',
  });
  return handleResponse(response);
}

