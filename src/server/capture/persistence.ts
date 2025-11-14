import {
  CaptureLifecycle,
  type CaptureSession,
} from '@/generated/prisma';
import {
  completeCaptureSessionRecord,
  createCaptureSessionRecord,
  updateCaptureSessionLifecycle,
  recordCapturedPacket,
} from '@/db/capture-repository';
import type { PacketSummary } from '@/capture';
import type { CaptureManagerState } from './manager';
import { CaptureError } from '@/capture';
import { logger } from '@/observability/logger';

interface PendingPacket {
  packet: PacketSummary;
}

export class CapturePersistenceCoordinator {
  private readonly enabled: boolean;
  private sessionRecord: CaptureSession | null = null;
  private queue: PendingPacket[] = [];
  private flushing = false;

  constructor() {
    this.enabled = Boolean(process.env.DATABASE_URL);
    if (!this.enabled) {
      logger.warn(
        '[CapturePersistence] DATABASE_URL is not set. Packet persistence is disabled.'
      );
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async handleStatus(state: CaptureManagerState) {
    if (!this.enabled) return;

    try {
      if (state.status === 'running' && !this.sessionRecord) {
        if (!state.device) {
          logger.warn(
            '[CapturePersistence] Cannot create session record without device name.'
          );
          return;
        }
        this.sessionRecord = await createCaptureSessionRecord({
          device: state.device,
          filter: state.filter ?? '',
          mode: state.mode === 'mock' ? 'mock' : 'real',
        });
        return;
      }

      if (!this.sessionRecord) {
        return;
      }

      await this.updateLifecycle(mapLifecycle(state.status));

      if (state.status === 'stopped' || state.status === 'idle') {
        await this.flushQueue();
        await completeCaptureSessionRecord(this.sessionRecord.id, {
          lifecycle: mapLifecycle(state.status),
          endedAt: new Date(),
        });
        this.sessionRecord = null;
      }
    } catch (error) {
      logger.error(
        { err: error },
        '[CapturePersistence] Failed to process status transition'
      );
    }
  }

  async handleError(error: CaptureError) {
    if (!this.enabled || !this.sessionRecord) return;
    try {
      const record = await completeCaptureSessionRecord(
        this.sessionRecord.id,
        {
          lifecycle: CaptureLifecycle.failed,
          errorMessage: `${error.code}: ${error.message}`,
          endedAt: new Date(),
        }
      );
      this.sessionRecord = record;
    } catch (err) {
      logger.error(
        { err },
        '[CapturePersistence] Failed to mark session as failed'
      );
    }
  }

  async enqueuePacket(packet: PacketSummary) {
    if (!this.enabled || !this.sessionRecord) {
      return;
    }
    this.queue.push({ packet });
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.flushing) return;
    this.flushing = true;
    setImmediate(() => {
      void this.flushQueue();
    });
  }

  private async flushQueue() {
    if (!this.enabled || !this.sessionRecord) {
      this.queue = [];
      this.flushing = false;
      return;
    }

    while (this.queue.length) {
      const next = this.queue.shift();
      if (!next) continue;
      try {
        await recordCapturedPacket(this.sessionRecord.id, next.packet);
      } catch (error) {
        logger.error(
          { err: error },
          '[CapturePersistence] Failed to record packet'
        );
        // Requeue and break to avoid busy-looping on failure.
        this.queue.unshift(next);
        break;
      }
    }

    this.flushing = false;
  }

  private async updateLifecycle(lifecycle: CaptureLifecycle) {
    if (!this.sessionRecord) return;
    if (this.sessionRecord.lifecycle === lifecycle) {
      return;
    }

    const record = await updateCaptureSessionLifecycle(
      this.sessionRecord.id,
      lifecycle
    );
    this.sessionRecord = record;
  }
}

function mapLifecycle(status: CaptureManagerState['status']): CaptureLifecycle {
  switch (status) {
    case 'starting':
      return CaptureLifecycle.starting;
    case 'running':
      return CaptureLifecycle.running;
    case 'stopping':
      return CaptureLifecycle.stopping;
    case 'stopped':
      return CaptureLifecycle.stopped;
    case 'idle':
    default:
      return CaptureLifecycle.idle;
  }
}

