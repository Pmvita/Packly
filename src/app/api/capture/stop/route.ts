import { NextRequest, NextResponse } from 'next/server';
import { authorizeCaptureRequest } from '@/server/auth/api-key';
import { getCaptureManager } from '@/server/capture/manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = authorizeCaptureRequest(request);
  if (!auth.ok) return auth.response;

  const manager = getCaptureManager();
  try {
    const state = await manager.stop();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to stop capture', details: (error as Error).message },
      { status: 500 }
    );
  }
}
