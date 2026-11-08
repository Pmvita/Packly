import { NextResponse } from 'next/server';
import { isAuthConfigured } from '@/server/auth/api-key';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    required: isAuthConfigured(),
  });
}
