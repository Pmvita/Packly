import { EventEmitter, on } from 'events';
import { randomUUID } from 'crypto';
import {
  CaptureConfig,
  CaptureError,
  CaptureOptions,
  CaptureStatus,
  PacketSummary,
} from './types';
import { resolveCaptureConfig } from './config';

type MockEventMap = {
  started: CaptureConfig;
  stopped: void;
  packet: PacketSummary;
  error: CaptureError;
  status: CaptureStatus;
};

const DEFAULT_INTERVAL_MS = 750;
const MOCK_PROTOCOLS = ['tcp', 'udp', 'icmp'] as const;
const MOCK_PORTS = [22, 53, 80, 443, 8080, 3306];

function randomChoice<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

export class MockCaptureSession {
  private readonly emitter = new EventEmitter();
  private interval: NodeJS.Timeout | null = null;
  private status: CaptureStatus = 'idle';
  private readonly config: CaptureConfig;

  constructor(options: CaptureOptions = {}) {
    this.config = resolveCaptureConfig({
      ...options,
      device: options.device ?? 'mock0',
      filter: options.filter ?? '',
    });
  }

  on<Event extends keyof MockEventMap>(
    event: Event,
    listener: (payload: MockEventMap[Event]) => void
  ): this {
    this.emitter.on(event, listener);
    return this;
  }

  off<Event extends keyof MockEventMap>(
    event: Event,
    listener: (payload: MockEventMap[Event]) => void
  ): this {
    this.emitter.off(event, listener);
    return this;
  }

  once<Event extends keyof MockEventMap>(
    event: Event,
    listener: (payload: MockEventMap[Event]) => void
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

  get currentStatus(): CaptureStatus {
    return this.status;
  }

  async start(): Promise<void> {
    if (this.interval) return;
    this.setStatus('starting');
    this.interval = setInterval(() => {
      this.emitter.emit('packet', buildMockPacket());
    }, DEFAULT_INTERVAL_MS);

    this.setStatus('running');
    this.emitter.emit('started', this.config);
  }

  async stop(): Promise<void> {
    if (!this.interval) return;
    this.setStatus('stopping');
    clearInterval(this.interval);
    this.interval = null;
    this.setStatus('stopped');
    this.emitter.emit('stopped', undefined);
  }

  dispose(): void {
    void this.stop();
    this.emitter.removeAllListeners();
  }

  private setStatus(status: CaptureStatus) {
    this.status = status;
    this.emitter.emit('status', status);
  }
}

function buildMockPacket(): PacketSummary {
  const protocol = randomChoice(MOCK_PROTOCOLS);
  const timestampMs = Date.now();
  const srcIp = `10.0.${Math.floor(Math.random() * 10)}.${Math.floor(
    Math.random() * 255
  )}`;
  const dstIp = `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(
    Math.random() * 255
  )}`;
  const srcPort = randomChoice(MOCK_PORTS);
  const dstPort = randomChoice(MOCK_PORTS);

  return {
    timestampMs,
    capturedLength: 128,
    originalLength: 128,
    truncated: false,
    ethernet: {
      srcMac: randomMac(),
      dstMac: randomMac(),
      etherType: '0x0800',
    },
    network: {
      version: 4,
      protocol,
      srcAddr: srcIp,
      dstAddr: dstIp,
      ttl: 64,
    },
    transport: {
      protocol,
      srcPort,
      dstPort,
      payloadLength: 64,
      flags:
        protocol === 'tcp'
          ? {
              ns: false,
              cwr: false,
              ece: false,
              urg: false,
              ack: true,
              psh: Math.random() > 0.5,
              rst: false,
              syn: Math.random() > 0.95,
              fin: false,
            }
          : undefined,
    },
  };
}

function randomMac(): string {
  const random = randomUUID().replace(/-/g, '');
  const bytes = random.slice(0, 12);
  return bytes.match(/.{1,2}/g)?.join(':') ?? '00:00:00:00:00:00';
}

export function createMockCaptureSession(options: CaptureOptions = {}) {
  return new MockCaptureSession(options);
}

