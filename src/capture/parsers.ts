import type { PacketHeader } from 'cap';
import { PacketSummary, TransportProtocol, TcpFlags } from './types';

const ETH_HEADER_LENGTH = 14;
const IPV4_ETHER_TYPE = 0x0800;
const IPV6_ETHER_TYPE = 0x86dd;

const ICMP_PROTOCOL = 1;
const TCP_PROTOCOL = 6;
const UDP_PROTOCOL = 17;
const ICMPV6_PROTOCOL = 58;

function formatMac(buffer: Buffer, offset: number): string {
  return Array.from(buffer.subarray(offset, offset + 6))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(':');
}

function formatIpv4(buffer: Buffer, offset: number): string {
  return Array.from(buffer.subarray(offset, offset + 4)).join('.');
}

function formatIpv6(buffer: Buffer, offset: number): string {
  const segments: string[] = [];
  for (let i = offset; i < offset + 16; i += 2) {
    segments.push(buffer.readUInt16BE(i).toString(16));
  }
  const collapsed = segments.join(':');
  return collapsed
    .replace(/(^|:)0(:0)+(:|$)/, '$1::$3')
    .replace(/:{3,}/, '::');
}

function parseTcpFlags(value: number): TcpFlags {
  return {
    ns: Boolean(value & 0x100),
    cwr: Boolean(value & 0x80),
    ece: Boolean(value & 0x40),
    urg: Boolean(value & 0x20),
    ack: Boolean(value & 0x10),
    psh: Boolean(value & 0x08),
    rst: Boolean(value & 0x04),
    syn: Boolean(value & 0x02),
    fin: Boolean(value & 0x01),
  };
}

function parseEthernet(buffer: Buffer) {
  if (buffer.length < ETH_HEADER_LENGTH) return null;
  const dstMac = formatMac(buffer, 0);
  const srcMac = formatMac(buffer, 6);
  const etherType = buffer.readUInt16BE(12);
  return { dstMac, srcMac, etherType };
}

function parseIPv4(buffer: Buffer, offset: number) {
  if (buffer.length < offset + 20) return null;
  const version = buffer[offset] >> 4;
  if (version !== 4) return null;
  const headerLength = (buffer[offset] & 0x0f) * 4;
  if (buffer.length < offset + headerLength) return null;
  const totalLength = buffer.readUInt16BE(offset + 2);
  const protocol = buffer[offset + 9];
  const srcAddr = formatIpv4(buffer, offset + 12);
  const dstAddr = formatIpv4(buffer, offset + 16);
  const ttl = buffer[offset + 8];
  const payloadLength = Math.max(totalLength - headerLength, 0);

  return {
    headerLength,
    payloadLength,
    protocol,
    srcAddr,
    dstAddr,
    ttl,
  };
}

function parseIPv6(buffer: Buffer, offset: number) {
  if (buffer.length < offset + 40) return null;
  const version = buffer[offset] >> 4;
  if (version !== 6) return null;
  const payloadLength = buffer.readUInt16BE(offset + 4);
  const nextHeader = buffer[offset + 6];
  const hopLimit = buffer[offset + 7];
  const srcAddr = formatIpv6(buffer, offset + 8);
  const dstAddr = formatIpv6(buffer, offset + 24);

  return {
    payloadLength,
    nextHeader,
    hopLimit,
    srcAddr,
    dstAddr,
  };
}

function parseTransport(
  protocol: number,
  buffer: Buffer,
  offset: number,
  payloadLength: number
) {
  if (protocol === TCP_PROTOCOL) {
    if (buffer.length < offset + 20) {
      return null;
    }
    const srcPort = buffer.readUInt16BE(offset);
    const dstPort = buffer.readUInt16BE(offset + 2);
    const controlBits = buffer.readUInt16BE(offset + 12);
    const dataOffset = (controlBits >> 12) * 4;
    const flags = parseTcpFlags(controlBits & 0x1ff);
    const tcpPayloadLength = Math.max(payloadLength - dataOffset, 0);

    return {
      protocol: 'tcp' as TransportProtocol,
      srcPort,
      dstPort,
      flags,
      payloadLength: tcpPayloadLength,
    };
  }

  if (protocol === UDP_PROTOCOL) {
    if (buffer.length < offset + 8) {
      return null;
    }
    const srcPort = buffer.readUInt16BE(offset);
    const dstPort = buffer.readUInt16BE(offset + 2);
    const length = buffer.readUInt16BE(offset + 4);
    const udpPayloadLength = Math.max(length - 8, 0);
    return {
      protocol: 'udp' as TransportProtocol,
      srcPort,
      dstPort,
      payloadLength: udpPayloadLength,
    };
  }

  if (protocol === ICMP_PROTOCOL) {
    return {
      protocol: 'icmp' as TransportProtocol,
      payloadLength,
    };
  }

  if (protocol === ICMPV6_PROTOCOL) {
    return {
      protocol: 'icmpv6' as TransportProtocol,
      payloadLength,
    };
  }

  return {
    protocol: 'unknown' as TransportProtocol,
    payloadLength,
  };
}

export function parsePacketSummary(
  buffer: Buffer,
  header: PacketHeader
): PacketSummary {
  const ethernet = parseEthernet(buffer);

  let network = null;
  let transport = null;
  const ipOffset = ETH_HEADER_LENGTH;

  if (ethernet) {
    if (ethernet.etherType === IPV4_ETHER_TYPE) {
      const ipv4 = parseIPv4(buffer, ipOffset);
      if (ipv4) {
        network = {
          version: 4 as const,
          protocol: toTransportProtocol(ipv4.protocol),
          srcAddr: ipv4.srcAddr,
          dstAddr: ipv4.dstAddr,
          ttl: ipv4.ttl,
        };
        const transportOffset = ipOffset + ipv4.headerLength;
        transport = parseTransport(
          ipv4.protocol,
          buffer,
          transportOffset,
          ipv4.payloadLength
        );
      }
    } else if (ethernet.etherType === IPV6_ETHER_TYPE) {
      const ipv6 = parseIPv6(buffer, ipOffset);
      if (ipv6) {
        network = {
          version: 6 as const,
          protocol: toTransportProtocol(ipv6.nextHeader),
          srcAddr: ipv6.srcAddr,
          dstAddr: ipv6.dstAddr,
          hopLimit: ipv6.hopLimit,
        };
        const transportOffset = ipOffset + 40;
        transport = parseTransport(
          ipv6.nextHeader,
          buffer,
          transportOffset,
          ipv6.payloadLength
        );
      }
    }
  }

  const seconds = header.seconds ?? header.timestampSeconds ?? 0;
  const fractional =
    header.nanoseconds != null
      ? header.nanoseconds / 1e6
      : header.timestampMicroseconds != null
        ? header.timestampMicroseconds / 1e3
        : 0;
  const timestampMs = Math.round(seconds * 1000 + fractional);

  const truncated = header.caplen < header.len;

  return {
    timestampMs,
    capturedLength: header.caplen,
    originalLength: header.len,
    truncated,
    ethernet: ethernet
      ? {
          srcMac: ethernet.srcMac,
          dstMac: ethernet.dstMac,
          etherType: `0x${ethernet.etherType.toString(16)}`,
        }
      : null,
    network,
    transport,
  };
}

function toTransportProtocol(value: number): TransportProtocol {
  switch (value) {
    case TCP_PROTOCOL:
      return 'tcp';
    case UDP_PROTOCOL:
      return 'udp';
    case ICMP_PROTOCOL:
      return 'icmp';
    case ICMPV6_PROTOCOL:
      return 'icmpv6';
    default:
      return 'unknown';
  }
}

