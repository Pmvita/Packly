import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import { Server as IOServer, type Socket as IOSocket } from 'socket.io';
import { getCaptureManager, type StartCaptureOptions } from '@/server/capture/manager';
import { CaptureError } from '@/capture';
import { logger } from '@/observability/logger';

type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: IOServer;
    };
  };
};

type GlobalWithSocket = typeof globalThis & {
  __packlySocketInitialised?: boolean;
};

const globalForSocket = globalThis as GlobalWithSocket;

const SOCKET_PATH = process.env.SOCKET_IO_PATH ?? '/api/socket';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (!res.socket?.server) {
    res.status(500).json({ error: 'Socket server not initialised' });
    return;
  }

  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: SOCKET_PATH,
      cors: {
        origin: '*',
      },
    });
    res.socket.server.io = io;

    if (!globalForSocket.__packlySocketInitialised__) {
      setupCaptureBroadcast(io);
      globalForSocket.__packlySocketInitialised__ = true;
      logger.info('[Packly] Socket.IO server initialised');
    }
  }

  res.end();
}

function setupCaptureBroadcast(io: IOServer) {
  const manager = getCaptureManager();

  const emitStatus = () => io.emit('capture:status', manager.getStatus());
  const emitPacket = (packet: unknown) => io.emit('capture:packet', packet);
  const emitError = (error: CaptureError) =>
    io.emit('capture:error', serializeCaptureError(error));

  manager.on('status', emitStatus);
  manager.on('packet', emitPacket);
  manager.on('error', emitError);

  io.on('connection', (socket: IOSocket) => {
    socket.emit('capture:status', manager.getStatus());

    socket.on('capture:start', async (payload: StartCaptureOptions = {}) => {
      try {
        const state = await manager.start(payload);
        socket.emit('capture:status', state);
      } catch (error) {
        socket.emit('capture:error', serializeCaptureError(error));
      }
    });

    socket.on('capture:stop', async () => {
      try {
        const state = await manager.stop();
        socket.emit('capture:status', state);
      } catch (error) {
        socket.emit('capture:error', serializeCaptureError(error));
      }
    });
  });
}

function serializeCaptureError(error: unknown) {
  if (error instanceof CaptureError) {
    return { code: error.code, message: error.message };
  }
  const err = error as Error;
  return {
    code: 'UNKNOWN_CAPTURE_ERROR',
    message: err?.message ?? 'Unknown Socket.IO capture error',
  };
}

