import { EventEmitter, on } from 'events';
import {
  CaptureError,
  CaptureOptions,
  CaptureSession,
  CaptureStatus,
  PacketSummary,
  createCaptureSession,
  createMockCaptureSession,
  resolveCaptureConfig,
} from '@/capture';
import { CapturePersistenceCoordinator } from './persistence';
import { logger } from '@/observability/logger';
import {
  incrementPacketMetrics,
  setCaptureStatus,
} from '@/observability/metrics';
import { getSummaryScheduler } from '@/server/background/summary-scheduler';

type ManagedSession = CaptureSession | ReturnType<typeof createMockCaptureSession>;

export interface CaptureManagerMetrics {
  totalPackets: number;
  lastPacketAt?: number;
  mode: 'real' | 'mock' | 'unknown';
}

export interface CaptureManagerState {
  status: CaptureStatus;
  mode: 'real' | 'mock' | 'unknown';
  device?: string;
  filter?: string;
  metrics: CaptureManagerMetrics;
}

export interface StartCaptureOptions extends CaptureOptions {
  useMock?: boolean;
  fallbackToMock?: boolean;
}

const DEFAULT_FALLBACK =
  process.env.PACKLY_CAPTURE_FALLBACK_TO_MOCK !== 'false';

type ManagerEventMap = {
  status: CaptureManagerState;
  packet: PacketSummary;
  error: CaptureError;
};

class CaptureManager extends EventEmitter {
  private session: ManagedSession | null = null;
  private state: CaptureManagerState = {
    status: 'idle',
    mode: 'unknown',
    metrics: {
      totalPackets: 0,
      lastPacketAt: undefined,
      mode: 'unknown',
    },
  };
  private listenersBound = false;
  private readonly persistence = new CapturePersistenceCoordinator();

  constructor() {
    super();
  }

  on<Event extends keyof ManagerEventMap>(
    event: Event,
    listener: (payload: ManagerEventMap[Event]) => void
  ): this {
    super.on(event, listener);
    return this;
  }

  off<Event extends keyof ManagerEventMap>(
    event: Event,
    listener: (payload: ManagerEventMap[Event]) => void
  ): this {
    super.off(event, listener);
    return this;
  }

  once<Event extends keyof ManagerEventMap>(
    event: Event,
    listener: (payload: ManagerEventMap[Event]) => void
  ): this {
    super.once(event, listener);
    return this;
  }

  async *packetStream(options: { signal?: AbortSignal } = {}) {
    const iterator = on(this, 'packet', {
      signal: options.signal,
    }) as AsyncIterableIterator<[PacketSummary]>;
    for await (const [packet] of iterator) {
      yield packet;
    }
  }

  getStatus(): CaptureManagerState {
    return { ...this.state, metrics: { ...this.state.metrics } };
  }

  async start(options: StartCaptureOptions = {}): Promise<CaptureManagerState> {
    if (this.session && this.state.status === 'running') {
      return this.getStatus();
    }

    await this.stop();

    const shouldMock = options.useMock ?? false;
    const fallbackToMock = options.fallbackToMock ?? DEFAULT_FALLBACK;

    const attemptStart = async (
      mode: 'real' | 'mock'
    ): Promise<CaptureManagerState> => {
      const session =
        mode === 'mock'
          ? createMockCaptureSession(options)
          : createCaptureSession(options);
      this.session = session;
      this.bindSessionEvents(session);
      try {
        await session.start();
      } catch (error) {
        this.unbindSessionEvents(session);
        this.session = null;
        throw error;
      }
      const config = resolveSafeConfig(options, mode);
      this.updateState({
        status: session.currentStatus,
        mode,
        device: config.device,
        filter: config.filter,
      });
      return this.getStatus();
    };

    try {
      let state: CaptureManagerState;
      if (shouldMock) {
        state = await attemptStart('mock');
      } else {
        state = await attemptStart('real');
        logger.info(
          {
            device: state.device,
            filter: state.filter,
            mode: state.mode,
          },
          '[CaptureManager] Capture started'
        );
      }
      return state;
    } catch (error) {
      if (!shouldMock && fallbackToMock) {
        logger.warn(
          {
            err: error,
            message: (error as Error).message,
          },
          '[CaptureManager] Falling back to mock capture'
        );
        const fallbackState = await attemptStart('mock');
        logger.warn(
          {
            device: fallbackState.device,
            filter: fallbackState.filter,
          },
          '[CaptureManager] Capture fallback to mock'
        );
        return fallbackState;
      }

      throw wrapAsCaptureError('CAPTURE_START_FAILED', error);
    }
  }

  async stop(): Promise<CaptureManagerState> {
    if (!this.session) {
      return this.getStatus();
    }
    try {
      await this.session.stop();
    } catch (error) {
      logger.error(
        { err: error },
        '[CaptureManager] Failed to stop capture gracefully'
      );
      this.emit(
        'error',
        wrapAsCaptureError('CAPTURE_STOP_FAILED', error as Error)
      );
    } finally {
      this.unbindSessionEvents(this.session);
      this.session = null;
      this.updateState({
        status: 'stopped',
        mode: 'unknown',
        device: undefined,
        filter: undefined,
        metrics: {
          totalPackets: 0,
          lastPacketAt: undefined,
          mode: 'unknown',
        },
      });
    }
    logger.info('[CaptureManager] Capture stopped');
    return this.getStatus();
  }

  private bindSessionEvents(session: ManagedSession) {
    if (this.listenersBound) return;

    session.on('packet', this.handlePacket);
    session.on('status', this.handleStatus);
    session.on('error', this.handleError);
    this.listenersBound = true;
  }

  private unbindSessionEvents(session: ManagedSession) {
    if (!this.listenersBound) return;
    session.off('packet', this.handlePacket);
    session.off('status', this.handleStatus);
    session.off('error', this.handleError);
    this.listenersBound = false;
  }

  private handlePacket = (packet: PacketSummary) => {
    this.state.metrics.totalPackets += 1;
    this.state.metrics.lastPacketAt = Date.now();
    this.emit('packet', packet);
    void this.persistence.enqueuePacket(packet);
    incrementPacketMetrics(
      this.state.mode,
      packet.transport?.protocol ?? 'unknown',
      packet.originalLength
    );
  };

  private handleStatus = (status: CaptureStatus) => {
    this.updateState({ status });
  };

  private handleError = (error: CaptureError) => {
    this.emit('error', error);
    void this.persistence.handleError(error);
    logger.error({ err: error }, '[CaptureManager] Session error');
  };

  private updateState(partial: Partial<CaptureManagerState>) {
    this.state = {
      ...this.state,
      ...partial,
      metrics: {
        ...this.state.metrics,
        ...(partial.metrics ?? {}),
        mode: partial.mode ?? this.state.mode,
      },
    };
    const snapshot = this.getStatus();
    this.emit('status', snapshot);
    void this.persistence.handleStatus(snapshot);
    setCaptureStatus(snapshot.status);
    logger.debug(
      {
        status: snapshot.status,
        mode: snapshot.mode,
        device: snapshot.device,
      },
      '[CaptureManager] Status update'
    );
  }
}

function wrapAsCaptureError(code: string, error: unknown): CaptureError {
  if (error instanceof CaptureError) {
    return error;
  }
  const err = error as Error;
  return new CaptureError(code, err?.message ?? 'Unknown capture error', {
    cause: err,
  });
}

function resolveSafeConfig(
  options: CaptureOptions,
  mode: 'real' | 'mock'
) {
  if (mode === 'mock') {
    return resolveCaptureConfig({
      ...options,
      device: options.device ?? 'mock0',
    });
  }
  return resolveCaptureConfig(options);
}

type GlobalWithCaptureManager = typeof globalThis & {
  __packlyCaptureManager?: CaptureManager;
};

const globalForManager = globalThis as GlobalWithCaptureManager;

export function getCaptureManager(): CaptureManager {
  if (!globalForManager.__packlyCaptureManager) {
    globalForManager.__packlyCaptureManager = new CaptureManager();
    getSummaryScheduler();
  }
  return globalForManager.__packlyCaptureManager;
}

