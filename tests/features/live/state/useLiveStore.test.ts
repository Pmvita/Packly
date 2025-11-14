import { afterEach, describe, expect, it } from 'vitest';
import { useLiveStore } from '@/features/live/state/useLiveStore';
import type { PacketSummary } from '@/capture';

const createPacket = (overrides: Partial<PacketSummary> = {}): PacketSummary => ({
  timestampMs: Date.now(),
  capturedLength: 64,
  originalLength: 64,
  truncated: false,
  ethernet: null,
  network: null,
  transport: null,
  ...overrides,
});

afterEach(() => {
  useLiveStore.setState({
    status: null,
    connected: false,
    lastError: null,
    packets: [],
    maxPackets: 200,
  });
});

describe('useLiveStore', () => {
  it('clears packets when capture stops', () => {
    const addPacket = useLiveStore.getState().addPacket;
    const setStatus = useLiveStore.getState().setStatus;

    addPacket(createPacket());
    expect(useLiveStore.getState().packets).toHaveLength(1);

    setStatus({
      status: 'stopped',
      mode: 'real',
      metrics: { totalPackets: 10, lastPacketAt: Date.now(), mode: 'real' },
    });

    expect(useLiveStore.getState().packets).toHaveLength(0);
  });

  it('retains only the latest packets within the sliding window', () => {
    const addPacket = useLiveStore.getState().addPacket;
    const maxPackets = useLiveStore.getState().maxPackets;

    for (let index = 0; index < maxPackets + 50; index += 1) {
      addPacket(createPacket({ timestampMs: index }));
    }

    const packets = useLiveStore.getState().packets;
    expect(packets).toHaveLength(maxPackets);
    expect(packets[0].timestampMs).toBe(50); // older packets trimmed
    expect(packets[packets.length - 1].timestampMs).toBe(maxPackets + 49);
  });
});

