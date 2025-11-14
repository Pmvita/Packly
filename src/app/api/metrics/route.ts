import { NextResponse } from 'next/server';
import { getMetricsSnapshot } from '@/observability/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metrics = await getMetricsSnapshot();
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

