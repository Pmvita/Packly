import { EventEmitter, on } from 'events';
import { Buffer } from 'buffer';
import { Cap, type PacketHeader } from 'cap';
import {
  CaptureConfig,
  CaptureError,
  CaptureOptions,
  CaptureStatus,
  PacketSummary,
  RawPacket,
} from './types';
import { resolveCaptureConfig } from './config';
import { parsePacketSummary } from './parsers';

type CaptureEventMap = {
  started: CaptureConfig;
  stopped: void;
  packet: PacketSummary;
  rawPacket: RawPacket;
  error: CaptureError;
  status: CaptureStatus;
};

export interface CaptureSessionMetrics {
  totalPackets: number;
  droppedPackets: number;
  lastPacketAt?: number;
}

export class CaptureSession {
  private readonly emitter = new EventEmitter();
  private readonly metrics: CaptureSessionMetrics = {
    totalPackets: 0,
    droppedPackets: 0,
  };

  private capInstance: Cap | null = null;
  private buffer: Buffer | null = null;
  private status: CaptureStatus = 'idle';
  private linkType: number | null = null;
  private readonly config: CaptureConfig;
  private readonly sessionName: string;

  constructor(options: CaptureOptions = {}) {
    this.config = resolveCaptureConfig(options);
    this.sessionName = options.sessionName ?? `capture:${this.config.device}`;
  }

  get currentStatus(): CaptureStatus {
    return this.status;
  }

  get stats(): CaptureSessionMetrics {
    return { ...this.metrics };
  }

  isRunning(): boolean {
    return this.status === 'running';
  }

  on<Event extends keyof CaptureEventMap>(
    event: Event,
    listener: (payload: CaptureEventMap[Event]) => void
  ): this {
    this.emitter.on(event, listener);
    return this;
  }

  off<Event extends keyof CaptureEventMap>(
    event: Event,
    listener: (payload: CaptureEventMap[Event]) => void
  ): this {
    this.emitter.off(event, listener);
    return this;
  }

  once<Event extends keyof CaptureEventMap>(
    event: Event,
    listener: (payload: CaptureEventMap[Event]) => void
  ): this {
    this.emitter.once(event, listener);
    return this;
  }

  async *packets(options: { signal?: AbortSignal } = {}) {
    const iterator = on(this.emitter, 'packet', {
      signal: options.signal,
    }) as AsyncIterableIterator<[PacketSummary]>;
    for await (const [packet] of iterator) {
      yield packet;
    }
  }

  emitStatus(status: CaptureStatus) {
    this.status = status;
    this.emitter.emit('status', status);
  }

  async start(): Promise<void> {
    if (this.capInstance) {
      if (this.status === 'running') {
        return;
      }
      throw new CaptureError(
        'CAPTURE_INVALID_STATE',
        `Capture session "${this.sessionName}" is not cleanly stopped.`
      );
    }

    let cap: Cap;
    try {
      cap = new Cap();
    } catch (error) {
      throw new CaptureError(
        'CAPTURE_MODULE_LOAD_FAILED',
        'Failed to initialize native capture binding. Ensure libpcap is installed and accessible.',
        { cause: error as Error }
      );
    }

    this.metrics.totalPackets = 0;
    this.metrics.droppedPackets = 0;
    this.metrics.lastPacketAt = undefined;
    this.emitStatus('starting');
    this.capInstance = cap;
    this.buffer = Buffer.allocUnsafe(this.config.snapLength);

    try {
      const linkType = cap.open(
        this.config.device,
        this.config.filter,
        this.config.bufferSize,
        this.buffer,
        this.config.snapLength
      );
      this.linkType = linkType;
      cap.setMinBytesForRead(this.config.minBytesForRead);
    } catch (error) {
      this.capInstance = null;
      this.buffer = null;
      this.emitStatus('idle');
      throw new CaptureError(
        'CAPTURE_OPEN_FAILED',
        `Failed to open device "${this.config.device}". ${(error as Error).message}`,
        { cause: error as Error }
      );
    }

    cap.on('packet', (nbytes, trunc, rawBuffer, header) => {
      try {
        this.metrics.totalPackets += 1;
        this.metrics.lastPacketAt = Date.now();
        const slice = Buffer.allocUnsafe(nbytes);
        rawBuffer.copy(slice, 0, 0, nbytes);
        if (trunc) {
          this.metrics.droppedPackets += 1;
        }

        const summary = tryParsePacket(slice, header);
        this.emitter.emit('rawPacket', { data: slice, header });
        this.emitter.emit('packet', summary);
      } catch (error) {
        const captureError =
          error instanceof CaptureError
            ? error
            : new CaptureError(
                'CAPTURE_PACKET_PARSE_FAILED',
                'Failed to decode captured packet.',
                { cause: error as Error }
              );
        this.emitter.emit('error', captureError);
      }
    });

    cap.on('close', () => {
      this.emitStatus('stopped');
      this.capInstance = null;
      this.buffer = null;
      this.linkType = null;
    });

    this.emitStatus('running');
    this.emitter.emit('started', this.config);
  }

  async stop(): Promise<void> {
    if (!this.capInstance) {
      return;
    }

    this.emitStatus('stopping');
    try {
      this.capInstance.close();
    } catch (error) {
      const captureError = new CaptureError(
        'CAPTURE_CLOSE_FAILED',
        'Failed to close capture session.',
        { cause: error as Error }
      );
      this.emitter.emit('error', captureError);
    } finally {
      this.capInstance = null;
      this.buffer = null;
      this.linkType = null;
      this.emitStatus('stopped');
      this.emitter.emit('stopped', undefined);
    }
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  dispose(): void {
    void this.stop();
    this.emitter.removeAllListeners();
  }
}

function tryParsePacket(buffer: Buffer, header: PacketHeader): PacketSummary {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new CaptureError(
      'CAPTURE_EMPTY_PACKET',
      'Received empty packet buffer from libpcap.'
    );
  }
  return parsePacketSummary(buffer, header);
}

export function createCaptureSession(options: CaptureOptions = {}) {
  return new CaptureSession(options);
}

