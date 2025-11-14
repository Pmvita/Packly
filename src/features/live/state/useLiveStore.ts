'use client';

import { create } from 'zustand';
import type { PacketSummary } from '@/capture';
import type { CaptureManagerState } from '@/server/capture/manager';

interface LiveState {
  status: CaptureManagerState | null;
  connected: boolean;
  lastError: string | null;
  packets: PacketSummary[];
  maxPackets: number;
  setConnected: (value: boolean) => void;
  setStatus: (status: CaptureManagerState) => void;
  addPacket: (packet: PacketSummary) => void;
  setLastError: (message: string | null) => void;
  clearPackets: () => void;
}

const MAX_PACKET_HISTORY = 200;

export const useLiveStore = create<LiveState>((set) => ({
  status: null,
  connected: false,
  lastError: null,
  packets: [],
  maxPackets: MAX_PACKET_HISTORY,
  setConnected: (value) => set({ connected: value }),
  setStatus: (status) =>
    set((state) => {
      const shouldClear =
        status.status === 'stopped' || status.status === 'idle';
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
      return { packets: next };
    }),
  setLastError: (message) => set({ lastError: message }),
  clearPackets: () => set({ packets: [] }),
}));

