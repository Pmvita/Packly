import { prisma } from '@/db/client';

const DEFAULT_TTL_DAYS = 30;

export async function cleanupExpiredPackets(ttlDays: number = DEFAULT_TTL_DAYS) {
  const cutoff = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000);
  const rawCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Clear raw payloads for packets older than 1 day to save space.
  await prisma.packet.updateMany({
    where: { capturedAt: { lt: rawCutoff }, rawPayload: { not: null } },
    data: { rawPayload: null },
  });

  // Delete packets (and cascading flows handled by FK? Packet.flow optional; delete packets only) older than TTL.
  const deleted = await prisma.packet.deleteMany({
    where: { capturedAt: { lt: cutoff } },
  });

  return { clearedRawPayloadBefore: rawCutoff, deletedPackets: deleted.count };
}
