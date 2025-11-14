import client from 'prom-client';
import type { TransportProtocol } from '@/capture';

const register = new client.Registry();

register.setDefaultLabels({
  service: 'packly',
});

client.collectDefaultMetrics({ register });

const packetCounter = new client.Counter({
  name: 'packly_packets_total',
  help: 'Total number of packets observed.',
  labelNames: ['mode', 'protocol'] as const,
  registers: [register],
});

const packetSizeHistogram = new client.Histogram({
  name: 'packly_packet_size_bytes',
  help: 'Distribution of packet payload sizes.',
  labelNames: ['protocol'] as const,
  buckets: [64, 128, 256, 512, 1024, 1518, 9018, 65535],
  registers: [register],
});

const captureStatusGauge = new client.Gauge({
  name: 'packly_capture_active',
  help: 'Capture status gauge.',
  labelNames: ['status'] as const,
  registers: [register],
});

export function incrementPacketMetrics(
  mode: 'real' | 'mock' | 'unknown',
  protocol: TransportProtocol,
  size: number
) {
  const proto = protocol ?? 'unknown';
  packetCounter.labels(mode, proto).inc();
  packetSizeHistogram.labels(proto).observe(size);
}

export function setCaptureStatus(status: string) {
  const statuses = ['idle', 'starting', 'running', 'stopping', 'stopped'];
  statuses.forEach((name) => {
    captureStatusGauge.labels(name).set(name === status ? 1 : 0);
  });
}

export async function getMetricsSnapshot(): Promise<string> {
  return register.metrics();
}

