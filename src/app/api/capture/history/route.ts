import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      message:
        'Historical capture queries are not implemented yet. This endpoint will return persisted flows once PostgreSQL integration is complete.',
      packets: [],
    },
    { status: 501 }
  );
}

