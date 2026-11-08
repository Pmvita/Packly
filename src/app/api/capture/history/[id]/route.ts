import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/client';
import { authorizeCaptureRequest } from '@/server/auth/api-key';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = authorizeCaptureRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const session = await prisma.captureSession.findFirst({
      where: {
        id,
        ...(auth.ownerApiKey ? { ownerApiKey: auth.ownerApiKey } : {}),
      },
      select: {
        id: true,
        name: true,
        device: true,
        filter: true,
        mode: true,
        lifecycle: true,
        errorMessage: true,
        startedAt: true,
        endedAt: true,
        packetCount: true,
        byteCount: true,
        flowCount: true,
        packets: {
          orderBy: { capturedAt: 'asc' },
          take: 200,
          select: {
            id: true,
            capturedAt: true,
            protocol: true,
            srcAddr: true,
            dstAddr: true,
            srcPort: true,
            dstPort: true,
            capturedLength: true,
            originalLength: true,
            tcpFlags: true,
          },
        },
        flows: {
          orderBy: { byteCount: 'desc' },
          take: 50,
          select: {
            id: true,
            protocol: true,
            srcAddr: true,
            dstAddr: true,
            srcPort: true,
            dstPort: true,
            packetCount: true,
            byteCount: true,
            firstSeenAt: true,
            lastSeenAt: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: {
        ...session,
        byteCount: session.byteCount.toString(),
        flows: session.flows.map((flow) => ({
          ...flow,
          byteCount: flow.byteCount.toString(),
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to load session',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
