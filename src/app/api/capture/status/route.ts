import { NextResponse } from 'next/server';
import { getCaptureManager } from '@/server/capture/manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const manager = getCaptureManager();
  return NextResponse.json(manager.getStatus());
}

