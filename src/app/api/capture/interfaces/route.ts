import { NextResponse } from 'next/server';
import { listCaptureInterfaces } from '@/capture';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const interfaces = listCaptureInterfaces();
    return NextResponse.json({
      interfaces,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to enumerate capture interfaces',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

