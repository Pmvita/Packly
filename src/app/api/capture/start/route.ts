import { NextRequest, NextResponse } from 'next/server';
import { getCaptureManager } from '@/server/capture/manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter for capture start (per process).
const startTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(): boolean {
  const now = Date.now();
  while (startTimestamps.length && now - startTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    startTimestamps.shift();
  }
  if (startTimestamps.length >= RATE_LIMIT_MAX) return false;
  startTimestamps.push(now);
  return true;
}

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
  if (!checkRateLimit()) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', details: 'Too many capture start requests.' },
      { status: 429 }
    );
  }
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

