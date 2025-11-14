import { prisma } from './client';
import {
  CaptureLifecycle,
  CaptureMode,
  Flow,
  Packet,
  Prisma,
  Protocol,
} from '@/generated/prisma';
import type { PacketSummary, TransportProtocol } from '@/capture';

export interface CaptureSessionCreateInput {
  name?: string;
  device: string;
  filter: string;
  mode: 'real' | 'mock';
  startedAt?: Date;
}

export interface CaptureSessionCompleteInput {
  lifecycle?: CaptureLifecycle;
  endedAt?: Date;
  errorMessage?: string | null;
}

export interface RecordPacketOptions {
  rawPayload?: Buffer;
}

const flowUniqueKeyName =
  'Flow_sessionId_protocol_srcAddr_dstAddr_srcPort_dstPort_key';

export async function createCaptureSessionRecord(
  input: CaptureSessionCreateInput
) {
  return prisma.captureSession.create({
    data: {
      name: input.name,
      device: input.device,
      filter: input.filter,
      mode: mapMode(input.mode),
      lifecycle: CaptureLifecycle.running,
      startedAt: input.startedAt ?? new Date(),
    },
  });
}

export async function completeCaptureSessionRecord(
  sessionId: string,
  input: CaptureSessionCompleteInput
) {
  return prisma.captureSession.update({
    where: { id: sessionId },
    data: {
      lifecycle: input.lifecycle ?? CaptureLifecycle.stopped,
      endedAt: input.endedAt ?? undefined,
      errorMessage: input.errorMessage ?? undefined,
    },
  });
}

export async function updateCaptureSessionLifecycle(
  sessionId: string,
  lifecycle: CaptureLifecycle
) {
  return prisma.captureSession.update({
    where: { id: sessionId },
    data: {
      lifecycle,
      updatedAt: new Date(),
    },
  });
}

export async function recordCapturedPacket(
  sessionId: string,
  packet: PacketSummary,
  options: RecordPacketOptions = {}
): Promise<Packet> {
  return prisma.$transaction(async (tx) => {
    const flow = await ensureFlow(tx, sessionId, packet);
    const createdPacket = await tx.packet.create({
      data: mapPacketData(sessionId, flow?.id ?? null, packet, options),
    });

    await tx.captureSession.update({
      where: { id: sessionId },
      data: {
        packetCount: { increment: 1 },
        byteCount: { increment: BigInt(packet.originalLength) },
        flowCount: flow?.wasCreated ? { increment: 1 } : undefined,
        updatedAt: new Date(),
      },
    });

    return createdPacket;
  });
}

export async function createTrafficSummary(
  sessionId: string,
  data: {
    intervalStart: Date;
    intervalEnd: Date;
    packetCount: number;
    byteCount: bigint;
    topTalkers: Prisma.JsonValue;
    protocolBreakdown: Prisma.JsonValue;
  }
) {
  return prisma.trafficSummary.upsert({
    where: {
      sessionId_intervalStart_intervalEnd: {
        sessionId,
        intervalStart: data.intervalStart,
        intervalEnd: data.intervalEnd,
      },
    },
    update: {
      packetCount: data.packetCount,
      byteCount: data.byteCount,
      topTalkers: data.topTalkers,
      protocolBreakdown: data.protocolBreakdown,
    },
    create: {
      sessionId,
      intervalStart: data.intervalStart,
      intervalEnd: data.intervalEnd,
      packetCount: data.packetCount,
      byteCount: data.byteCount,
      topTalkers: data.topTalkers,
      protocolBreakdown: data.protocolBreakdown,
    },
  });
}

async function ensureFlow(
  tx: Prisma.TransactionClient,
  sessionId: string,
  packet: PacketSummary
): Promise<(Flow & { wasCreated: boolean }) | null> {
  if (!packet.network) {
    return null;
  }

  const protocol = toProtocol(packet.transport?.protocol ?? 'unknown');

  const identity = {
    sessionId,
    protocol,
    srcAddr: packet.network.srcAddr ?? 'unknown',
    dstAddr: packet.network.dstAddr ?? 'unknown',
    srcPort: packet.transport?.srcPort ?? null,
    dstPort: packet.transport?.dstPort ?? null,
  };

  const uniqueWhere = {
    [flowUniqueKeyName]: identity,
  } as const;

  const existing = await tx.flow.findUnique({
    where: uniqueWhere,
  });

  const now = new Date(packet.timestampMs);
  const byteCount = BigInt(packet.originalLength);

  if (existing) {
    const updated = await tx.flow.update({
      where: uniqueWhere,
      data: {
        lastSeenAt: now,
        packetCount: { increment: 1 },
        byteCount: { increment: byteCount },
      },
    });
    return { ...updated, wasCreated: false };
  }

  const created = await tx.flow.create({
    data: {
      sessionId,
      protocol,
      srcAddr: identity.srcAddr,
      dstAddr: identity.dstAddr,
      srcPort: identity.srcPort,
      dstPort: identity.dstPort,
      firstSeenAt: now,
      lastSeenAt: now,
      packetCount: 1,
      byteCount,
    },
  });

  return { ...created, wasCreated: true };
}

function mapPacketData(
  sessionId: string,
  flowId: string | null,
  packet: PacketSummary,
  options: RecordPacketOptions
): Prisma.PacketCreateInput {
  const protocol = toProtocol(packet.transport?.protocol ?? 'unknown');
  return {
    session: { connect: { id: sessionId } },
    flow: flowId ? { connect: { id: flowId } } : undefined,
    capturedAt: new Date(packet.timestampMs),
    capturedLength: packet.capturedLength,
    originalLength: packet.originalLength,
    truncated: packet.truncated,
    protocol,
    srcMac: packet.ethernet?.srcMac ?? null,
    dstMac: packet.ethernet?.dstMac ?? null,
    srcAddr: packet.network?.srcAddr ?? null,
    dstAddr: packet.network?.dstAddr ?? null,
    srcPort: packet.transport?.srcPort ?? null,
    dstPort: packet.transport?.dstPort ?? null,
    ttl: packet.network?.ttl ?? null,
    hopLimit: packet.network?.hopLimit ?? null,
    payloadLength: packet.transport?.payloadLength ?? null,
    tcpFlags: packet.transport?.flags
      ? (packet.transport.flags as unknown as Prisma.JsonValue)
      : Prisma.JsonNull,
    rawPayload: options.rawPayload ?? undefined,
  };
}

function mapMode(mode: 'real' | 'mock'): CaptureMode {
  return mode === 'mock' ? CaptureMode.mock : CaptureMode.real;
}

function toProtocol(protocol: TransportProtocol): Protocol {
  switch (protocol) {
    case 'tcp':
      return Protocol.tcp;
    case 'udp':
      return Protocol.udp;
    case 'icmp':
      return Protocol.icmp;
    case 'icmpv6':
      return Protocol.icmpv6;
    default:
      return Protocol.unknown;
  }
}

