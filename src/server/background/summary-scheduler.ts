import { CaptureLifecycle } from '@/generated/prisma';
import { prisma } from '@/db/client';
import { createTrafficSummary } from '@/db/capture-repository';
import { logger } from '@/observability/logger';

const DEFAULT_INTERVAL_MINUTES = Number(
  process.env.SUMMARY_ROLLUP_INTERVAL_MINUTES ?? '5'
);

const INTERVAL_MS = Math.max(DEFAULT_INTERVAL_MINUTES, 1) * 60 * 1000;

class SummaryScheduler {
  private timer: NodeJS.Timeout | null = null;

  start() {
    if (this.timer) return;
    if (!process.env.DATABASE_URL) {
      logger.warn(
        '[SummaryScheduler] DATABASE_URL not set. Background rollups disabled.'
      );
      return;
    }
    this.timer = setInterval(() => {
      void this.run();
    }, INTERVAL_MS);
    logger.info(
      `[SummaryScheduler] Started with interval ${INTERVAL_MS / 1000}s.`
    );
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    logger.info('[SummaryScheduler] Stopped.');
  }

  private async run() {
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - INTERVAL_MS);

    try {
      const activeSessions = await prisma.captureSession.findMany({
        where: {
          lifecycle: {
            in: [
              CaptureLifecycle.running,
              CaptureLifecycle.starting,
              CaptureLifecycle.stopping,
            ],
          },
        },
        select: { id: true },
      });

      if (!activeSessions.length) {
        return;
      }

      for (const session of activeSessions) {
        await summariseSession(session.id, windowStart, windowEnd);
      }
    } catch (error) {
      logger.error(
        { err: error },
        '[SummaryScheduler] Failed to execute rollup loop'
      );
    }
  }
}

async function summariseSession(
  sessionId: string,
  intervalStart: Date,
  intervalEnd: Date
) {
  const packetsGroup = await prisma.packet.groupBy({
    where: {
      sessionId,
      capturedAt: {
        gte: intervalStart,
        lte: intervalEnd,
      },
    },
    by: ['protocol'],
    _count: {
      _all: true,
    },
    _sum: {
      originalLength: true,
    },
  });

  const totals = packetsGroup.reduce(
    (acc, group) => {
      acc.packetCount += group._count._all ?? 0;
      acc.byteCount += BigInt(group._sum.originalLength ?? 0);
      return acc;
    },
    { packetCount: 0, byteCount: BigInt(0) }
  );

  if (totals.packetCount === 0) {
    return;
  }

  const topTalkers = await prisma.flow.findMany({
    where: { sessionId },
    orderBy: {
      byteCount: 'desc',
    },
    take: 5,
    select: {
      protocol: true,
      srcAddr: true,
      dstAddr: true,
      srcPort: true,
      dstPort: true,
      byteCount: true,
      packetCount: true,
    },
  });

  const protocolBreakdown = packetsGroup.map((group) => ({
    protocol: group.protocol,
    packets: group._count._all ?? 0,
    bytes: Number(group._sum.originalLength ?? 0),
  }));

  await createTrafficSummary(sessionId, {
    intervalStart,
    intervalEnd,
    packetCount: totals.packetCount,
    byteCount: totals.byteCount,
    topTalkers: topTalkers.map((talker) => ({
      protocol: talker.protocol,
      srcAddr: talker.srcAddr,
      dstAddr: talker.dstAddr,
      srcPort: talker.srcPort,
      dstPort: talker.dstPort,
      packetCount: talker.packetCount,
      byteCount: talker.byteCount.toString(),
    })),
    protocolBreakdown,
  });
}

type GlobalWithScheduler = typeof globalThis & {
  __packlySummaryScheduler?: SummaryScheduler;
};

const globalForScheduler = globalThis as GlobalWithScheduler;

export function getSummaryScheduler(): SummaryScheduler {
  if (!globalForScheduler.__packlySummaryScheduler) {
    globalForScheduler.__packlySummaryScheduler = new SummaryScheduler();
    globalForScheduler.__packlySummaryScheduler.start();
  }
  return globalForScheduler.__packlySummaryScheduler;
}

