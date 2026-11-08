'use client';

import { create } from 'zustand';
import type { PacketSummary } from '@/capture/types';
import type { CaptureManagerState } from '@/server/capture/manager';

interface LiveState {
  status: CaptureManagerState | null;
  connected: boolean;
  lastError: string | null;
  packets: PacketSummary[];
  packetSource: 'live' | 'pcap';
  maxPackets: number;
  setConnected: (value: boolean) => void;
  setStatus: (status: CaptureManagerState) => void;
  addPacket: (packet: PacketSummary) => void;
  setPackets: (packets: PacketSummary[]) => void;
  setLastError: (message: string | null) => void;
  clearPackets: () => void;
}

const MAX_PACKET_HISTORY = 200;

export const useLiveStore = create<LiveState>((set) => ({
  status: null,
  connected: false,
  lastError: null,
  packets: [],
  packetSource: 'live',
  maxPackets: MAX_PACKET_HISTORY,
  setConnected: (value) => set({ connected: value }),
  setStatus: (status) =>
    set((state) => {
      const shouldClear =
        state.packetSource === 'live' &&
        (status.status === 'stopped' || status.status === 'idle');
      return {
        status,
        packets: shouldClear ? [] : state.packets,
        lastError: shouldClear ? null : state.lastError,
      };
    }),
  addPacket: (packet) =>
    set((state) => {
      const next = [...state.packets, packet];
      if (next.length > state.maxPackets) {
        next.splice(0, next.length - state.maxPackets);
      }
      return { packets: next, packetSource: 'live' };
    }),
  setPackets: (packets) =>
    set((state) => ({
      packets: packets.slice(-state.maxPackets),
      packetSource: 'pcap',
    })),
  setLastError: (message) => set({ lastError: message }),
  clearPackets: () => set({ packets: [], packetSource: 'live' }),
}));
