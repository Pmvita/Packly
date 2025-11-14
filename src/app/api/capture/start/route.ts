import { NextRequest, NextResponse } from 'next/server';
import { getCaptureManager } from '@/server/capture/manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StartCapturePayload {
  device?: string;
  filter?: string;
  snapLength?: number;
  bufferSize?: number;
  promiscuous?: boolean;
  minBytesForRead?: number;
  useMock?: boolean;
  fallbackToMock?: boolean;
}

function parsePayload(body: unknown): StartCapturePayload {
  if (!body || typeof body !== 'object') return {};
  const value = body as Record<string, unknown>;
  return {
    device: typeof value.device === 'string' ? value.device : undefined,
    filter: typeof value.filter === 'string' ? value.filter : undefined,
    snapLength:
      typeof value.snapLength === 'number' ? value.snapLength : undefined,
    bufferSize:
      typeof value.bufferSize === 'number' ? value.bufferSize : undefined,
    promiscuous:
      typeof value.promiscuous === 'boolean'
        ? value.promiscuous
        : undefined,
    minBytesForRead:
      typeof value.minBytesForRead === 'number'
        ? value.minBytesForRead
        : undefined,
    useMock:
      typeof value.useMock === 'boolean' ? value.useMock : undefined,
    fallbackToMock:
      typeof value.fallbackToMock === 'boolean'
        ? value.fallbackToMock
        : undefined,
  };
}

export async function POST(request: NextRequest) {
  const manager = getCaptureManager();
  let payload: StartCapturePayload = {};
  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      payload = parsePayload(await request.json());
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload', details: (error as Error).message },
      { status: 400 }
    );
  }

  try {
    const state = await manager.start(payload);
    return NextResponse.json(state, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to start capture',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

