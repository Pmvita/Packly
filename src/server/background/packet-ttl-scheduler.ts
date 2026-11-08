import { cleanupExpiredPackets } from '@/server/background/packet-ttl';
import { logger } from '@/observability/logger';

const DEFAULT_INTERVAL_HOURS = Number(
  process.env.PACKET_TTL_CLEANUP_INTERVAL_HOURS ?? '6'
);
const TTL_DAYS = Number(process.env.PACKET_TTL_DAYS ?? '30');
const INTERVAL_MS = Math.max(DEFAULT_INTERVAL_HOURS, 1) * 60 * 60 * 1000;

class PacketTtlScheduler {
  private timer: NodeJS.Timeout | null = null;

  start() {
    if (this.timer) return;
    if (!process.env.DATABASE_URL) {
      logger.warn(
        '[PacketTtlScheduler] DATABASE_URL not set. Packet TTL cleanup disabled.'
      );
      return;
    }

    // Run once shortly after boot, then on interval.
    void this.run();
    this.timer = setInterval(() => {
      void this.run();
    }, INTERVAL_MS);

    logger.info(
      `[PacketTtlScheduler] Started (ttl=${TTL_DAYS}d, interval=${INTERVAL_MS / 3600000}h).`
    );
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    logger.info('[PacketTtlScheduler] Stopped.');
  }

  private async run() {
    try {
      const result = await cleanupExpiredPackets(TTL_DAYS);
      logger.info(
        {
          deletedPackets: result.deletedPackets,
          clearedRawPayloadBefore: result.clearedRawPayloadBefore.toISOString(),
        },
        '[PacketTtlScheduler] Cleanup complete'
      );
    } catch (error) {
      logger.error(
        { err: error },
        '[PacketTtlScheduler] Failed to clean expired packets'
      );
    }
  }
}

type GlobalWithTtlScheduler = typeof globalThis & {
  __packlyPacketTtlScheduler?: PacketTtlScheduler;
};

const globalForTtl = globalThis as GlobalWithTtlScheduler;

export function getPacketTtlScheduler(): PacketTtlScheduler {
  if (!globalForTtl.__packlyPacketTtlScheduler) {
    globalForTtl.__packlyPacketTtlScheduler = new PacketTtlScheduler();
    globalForTtl.__packlyPacketTtlScheduler.start();
  }
  return globalForTtl.__packlyPacketTtlScheduler;
}
