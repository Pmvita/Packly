'use client';

import { ReactNode, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { CaptureManagerState } from '@/server/capture/manager';
import type { PacketSummary } from '@/capture';
import { useLiveStore } from '../state/useLiveStore';

const SOCKET_PATH =
  process.env.NEXT_PUBLIC_SOCKET_PATH ?? process.env.SOCKET_IO_PATH ?? '/api/socket';

interface LiveSocketProviderProps {
  children: ReactNode;
}

type CaptureSocket = Socket<{
  'capture:status': (state: CaptureManagerState) => void;
  'capture:packet': (packet: PacketSummary) => void;
  'capture:error': (error: { code?: string; message?: string }) => void;
}>;

export function LiveSocketProvider({ children }: LiveSocketProviderProps) {
  const setConnected = useLiveStore((state) => state.setConnected);
  const setStatus = useLiveStore((state) => state.setStatus);
  const addPacket = useLiveStore((state) => state.addPacket);
  const setLastError = useLiveStore((state) => state.setLastError);

  useEffect(() => {
    const socket: CaptureSocket = io({
      path: SOCKET_PATH,
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      setConnected(true);
      setLastError(null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('capture:status', (state) => {
      setStatus(state);
    });

    socket.on('capture:packet', (packet) => {
      addPacket(packet);
    });

    socket.on('capture:error', (error) => {
      const message = error?.message ?? 'Unknown capture error';
      setLastError(message);
      console.error('[Packly] capture:error', error);
    });

    return () => {
      socket.removeAllListeners();
      socket.close();
    };
  }, [setConnected, setStatus, addPacket, setLastError]);

  return <>{children}</>;
}

