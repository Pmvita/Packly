import type { PacketHeader } from 'cap';

export type TransportProtocol =
  | 'tcp'
  | 'udp'
  | 'icmp'
  | 'icmpv6'
  | 'unknown';

export interface CaptureConfig {
  device: string;
  filter: string;
  snapLength: number;
  bufferSize: number;
  promiscuous: boolean;
  minBytesForRead: number;
}

export interface CaptureOptions extends Partial<CaptureConfig> {
  /** Friendly name for logging/metrics */
  sessionName?: string;
}

export interface EthernetHeader {
  srcMac: string;
  dstMac: string;
  etherType: string;
}

export interface NetworkHeader {
  version: 4 | 6;
  protocol: TransportProtocol;
  srcAddr: string;
  dstAddr: string;
  ttl?: number;
  hopLimit?: number;
}

export interface TcpFlags {
  ns: boolean;
  cwr: boolean;
  ece: boolean;
  urg: boolean;
  ack: boolean;
  psh: boolean;
  rst: boolean;
  syn: boolean;
  fin: boolean;
}

export interface TransportHeader {
  protocol: TransportProtocol;
  srcPort?: number;
  dstPort?: number;
  flags?: TcpFlags;
  payloadLength?: number;
}

export interface PacketSummary {
  timestampMs: number;
  capturedLength: number;
  originalLength: number;
  truncated: boolean;
  ethernet: EthernetHeader | null;
  network: NetworkHeader | null;
  transport: TransportHeader | null;
}

export interface RawPacket {
  data: Buffer;
  header: PacketHeader;
}

export type CaptureStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'stopped';

export class CaptureError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'CaptureError';
  }
}

