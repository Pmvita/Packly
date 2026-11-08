import { NextResponse } from 'next/server';
import { prisma } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessions = await prisma.captureSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        device: true,
        filter: true,
        mode: true,
        lifecycle: true,
        startedAt: true,
        endedAt: true,
        packetCount: true,
        byteCount: true,
        flowCount: true,
      },
    });
    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          'Historical capture queries are unavailable (database not configured).',
        sessions: [],
        details: (error as Error).message,
      },
      { status: 200 }
    );
  }
}

