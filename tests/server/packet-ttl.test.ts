import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db/client', () => {
  return {
    prisma: {
      packet: {
        updateMany: vi.fn(async () => ({ count: 2 })),
        deleteMany: vi.fn(async () => ({ count: 5 })),
      },
    },
  };
});

import { prisma } from '@/db/client';
import { cleanupExpiredPackets } from '@/server/background/packet-ttl';

describe('packet TTL cleanup', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('clears raw payloads after 1 day and deletes packets past TTL', async () => {
    const before = Date.now();
    const result = await cleanupExpiredPackets(30);
    const after = Date.now();

    expect(prisma.packet.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.packet.deleteMany).toHaveBeenCalledTimes(1);

    const updateArg = vi.mocked(prisma.packet.updateMany).mock.calls[0][0];
    const deleteArg = vi.mocked(prisma.packet.deleteMany).mock.calls[0][0];

    const rawCutoff = updateArg?.where?.capturedAt?.lt as Date;
    const ttlCutoff = deleteArg?.where?.capturedAt?.lt as Date;

    expect(rawCutoff).toBeInstanceOf(Date);
    expect(ttlCutoff).toBeInstanceOf(Date);

    const oneDayMs = 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * oneDayMs;

    expect(Math.abs(before - oneDayMs - rawCutoff.getTime())).toBeLessThan(
      after - before + 50
    );
    expect(Math.abs(before - thirtyDaysMs - ttlCutoff.getTime())).toBeLessThan(
      after - before + 50
    );

    expect(result.deletedPackets).toBe(5);
    expect(result.clearedRawPayloadBefore).toEqual(rawCutoff);
  });
});
