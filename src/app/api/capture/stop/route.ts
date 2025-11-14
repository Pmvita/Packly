import { NextResponse } from 'next/server';
import { getCaptureManager } from '@/server/capture/manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
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

