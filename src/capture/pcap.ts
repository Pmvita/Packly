import { CaptureError, PacketHeader, PacketSummary } from './types';
import { parsePacketSummary } from './parsers';

const PCAP_MAGIC_USEC_LE = 0xa1b2c3d4;
const PCAP_MAGIC_USEC_BE = 0xd4c3b2a1;
const PCAP_MAGIC_NSEC_LE = 0xa1b23c4d;
const PCAP_MAGIC_NSEC_BE = 0x4d3cb2a1;
const LINKTYPE_ETHERNET = 1;
const GLOBAL_HEADER_LENGTH = 24;
const RECORD_HEADER_LENGTH = 16;

const SHB_MAGIC = 0x0a0d0d0a;
const SHB_BYTE_ORDER_MAGIC_LE = 0x1a2b3c4d;
const SHB_BYTE_ORDER_MAGIC_BE = 0x4d3c2b1a;
const BLOCK_IDB = 0x00000001;
const BLOCK_EPB = 0x00000006;

export type PcapPacket = {
  data: Buffer;
  header: PacketHeader;
};

export function encodePcap(packets: PcapPacket[]): Buffer {
  const payloadLength = packets.reduce(
    (sum, packet) => sum + RECORD_HEADER_LENGTH + packet.data.length,
    0
  );
  const file = Buffer.alloc(GLOBAL_HEADER_LENGTH + payloadLength);
  file.writeUInt32LE(PCAP_MAGIC_USEC_LE, 0);
  file.writeUInt16LE(2, 4);
  file.writeUInt16LE(4, 6);
  file.writeInt32LE(0, 8);
  file.writeUInt32LE(0, 12);
  file.writeUInt32LE(65535, 16);
  file.writeUInt32LE(LINKTYPE_ETHERNET, 20);

  let offset = GLOBAL_HEADER_LENGTH;
  for (const packet of packets) {
    const seconds = packet.header.seconds;
    const microseconds =
      packet.header.timestampMicroseconds ??
      Math.round((packet.header.nanoseconds ?? 0) / 1e3);
    file.writeUInt32LE(seconds, offset);
    file.writeUInt32LE(microseconds, offset + 4);
    file.writeUInt32LE(packet.data.length, offset + 8);
    file.writeUInt32LE(packet.header.len || packet.data.length, offset + 12);
    packet.data.copy(file, offset + RECORD_HEADER_LENGTH);
    offset += RECORD_HEADER_LENGTH + packet.data.length;
  }

  return file;
}

export function parsePcap(buffer: Buffer): PacketSummary[] {
  return parsePcapRecords(buffer).map((packet) =>
    parsePacketSummary(packet.data, packet.header)
  );
}

export function parsePcapRecords(buffer: Buffer): PcapPacket[] {
  if (buffer.length < 4) {
    throw new CaptureError('PCAP_TOO_SHORT', 'File is too short to be a pcap.');
  }
  const firstMagic = buffer.readUInt32LE(0);
  if (firstMagic === SHB_MAGIC) {
    return parsePcapngRecords(buffer);
  }
  return parseClassicPcapRecords(buffer);
}

function parseClassicPcapRecords(buffer: Buffer): PcapPacket[] {
  if (buffer.length < GLOBAL_HEADER_LENGTH) {
    throw new CaptureError('PCAP_TOO_SHORT', 'File is too short to be a pcap.');
  }

  const magic = buffer.readUInt32LE(0);
  const littleEndian =
    magic === PCAP_MAGIC_USEC_LE || magic === PCAP_MAGIC_NSEC_LE;
  const nanosecond =
    magic === PCAP_MAGIC_NSEC_LE || magic === PCAP_MAGIC_NSEC_BE;
  if (
    magic !== PCAP_MAGIC_USEC_LE &&
    magic !== PCAP_MAGIC_USEC_BE &&
    magic !== PCAP_MAGIC_NSEC_LE &&
    magic !== PCAP_MAGIC_NSEC_BE
  ) {
    throw new CaptureError(
      'PCAP_BAD_MAGIC',
      'Unrecognized capture file magic (expected classic pcap or pcapng).'
    );
  }

  const readU16 = (offset: number) =>
    littleEndian ? buffer.readUInt16LE(offset) : buffer.readUInt16BE(offset);
  const readU32 = (offset: number) =>
    littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);

  const versionMajor = readU16(4);
  const network = readU32(20);
  if (versionMajor !== 2) {
    throw new CaptureError(
      'PCAP_UNSUPPORTED_VERSION',
      `Unsupported pcap version ${versionMajor}.`
    );
  }
  if (network !== LINKTYPE_ETHERNET) {
    throw new CaptureError(
      'PCAP_UNSUPPORTED_LINKTYPE',
      `Only Ethernet pcaps are supported (got linktype ${network}).`
    );
  }

  const packets: PcapPacket[] = [];
  let offset = GLOBAL_HEADER_LENGTH;
  while (offset + RECORD_HEADER_LENGTH <= buffer.length) {
    const tsSec = readU32(offset);
    const tsFrac = readU32(offset + 4);
    const inclLen = readU32(offset + 8);
    const origLen = readU32(offset + 12);
    offset += RECORD_HEADER_LENGTH;
    if (offset + inclLen > buffer.length) {
      throw new CaptureError(
        'PCAP_TRUNCATED_RECORD',
        'Packet record extends past the end of the file.'
      );
    }
    const data = Buffer.from(buffer.subarray(offset, offset + inclLen));
    offset += inclLen;
    packets.push({
      data,
      header: {
        seconds: tsSec,
        nanoseconds: nanosecond ? tsFrac : tsFrac * 1000,
        timestampMicroseconds: nanosecond ? Math.round(tsFrac / 1000) : tsFrac,
        caplen: inclLen,
        len: origLen,
      },
    });
  }

  return packets;
}

// ---- PCAPNG ----

function rU16(buf: Buffer, off: number, le: boolean) {
  return le ? buf.readUInt16LE(off) : buf.readUInt16BE(off);
}
function rU32(buf: Buffer, off: number, le: boolean) {
  return le ? buf.readUInt32LE(off) : buf.readUInt32BE(off);
}

type Iface = { linktype: number; tsresol: number };

function convertTimestamp(
  raw: bigint,
  tsresol: number
): { seconds: number; nanoseconds: number; timestampMicroseconds: number } {
  let base = 10;
  const exp = tsresol & 0x7f;
  if (tsresol & 0x80) base = 2;
  let nsPerTick: number;
  if (base === 10) {
    nsPerTick = Math.pow(10, 9 - exp);
  } else {
    nsPerTick = 1e9 / Math.pow(2, exp);
  }
  const ns = Number(raw) * nsPerTick;
  const seconds = Math.floor(ns / 1e9);
  const nanoseconds = Math.round(ns - seconds * 1e9);
  const timestampMicroseconds = Math.round(ns / 1e3);
  return { seconds, nanoseconds, timestampMicroseconds };
}

function parseOptions(buf: Buffer, start: number, end: number, le: boolean): { tsresol: number } {
  let tsresol = 6;
  let o = start;
  while (o + 4 <= end) {
    const code = rU16(buf, o, le);
    const len = rU16(buf, o + 2, le);
    if (code === 0) break;
    if (code === 9 && len >= 1) {
      tsresol = buf[o + 4];
    }
    const padded = (len + 3) & ~3;
    o += 4 + padded;
  }
  return { tsresol };
}

function parsePcapngRecords(buffer: Buffer): PcapPacket[] {
  if (buffer.length < 12) {
    throw new CaptureError('PCAP_TOO_SHORT', 'File is too short to be a pcapng.');
  }
  const bom = buffer.readUInt32LE(8);
  let le: boolean;
  if (bom === SHB_BYTE_ORDER_MAGIC_LE) le = true;
  else if (bom === SHB_BYTE_ORDER_MAGIC_BE) le = false;
  else {
    throw new CaptureError('PCAP_BAD_MAGIC', 'Not a pcapng file (bad byte-order magic).');
  }

  const packets: PcapPacket[] = [];
  const interfaces: Iface[] = [];
  let offset = 0;
  while (offset + 12 <= buffer.length) {
    const blockType = rU32(buffer, offset, le);
    const blockTotalLen = rU32(buffer, offset + 4, le);
    if (blockTotalLen < 12 || offset + blockTotalLen > buffer.length) {
      throw new CaptureError('PCAP_TRUNCATED_RECORD', 'pcapng block extends past end of file.');
    }
    const bodyStart = offset + 8;
    const bodyEnd = offset + blockTotalLen - 4;

    if (blockType === BLOCK_IDB) {
      const linktype = rU16(buffer, bodyStart, le);
      const { tsresol } = parseOptions(buffer, bodyStart + 8, bodyEnd, le);
      interfaces.push({ linktype, tsresol });
    } else if (blockType === BLOCK_EPB) {
      const ifaceId = rU32(buffer, bodyStart, le);
      const tsHigh = rU32(buffer, bodyStart + 4, le);
      const tsLow = rU32(buffer, bodyStart + 8, le);
      const caplen = rU32(buffer, bodyStart + 12, le);
      const origlen = rU32(buffer, bodyStart + 16, le);
      const dataStart = bodyStart + 20;
      if (dataStart + caplen > bodyEnd) {
        throw new CaptureError('PCAP_TRUNCATED_RECORD', 'EPB packet data extends past block.');
      }
      const data = Buffer.from(buffer.subarray(dataStart, dataStart + caplen));
      const iface = interfaces[ifaceId] ?? { linktype: LINKTYPE_ETHERNET, tsresol: 6 };
      if (iface.linktype === LINKTYPE_ETHERNET) {
        const rawTs = BigInt(tsHigh) * BigInt(0x100000000) + BigInt(tsLow);
        const { seconds, nanoseconds, timestampMicroseconds } = convertTimestamp(rawTs, iface.tsresol);
        packets.push({
          data,
          header: {
            seconds,
            nanoseconds,
            timestampMicroseconds,
            caplen,
            len: origlen,
          },
        });
      }
    } else if (blockType === 0x00000003) {
      const origlen = rU32(buffer, bodyStart, le);
      const dataStart = bodyStart + 4;
      const caplen = Math.min(origlen, bodyEnd - dataStart);
      const data = Buffer.from(buffer.subarray(dataStart, dataStart + caplen));
      const iface = interfaces[0] ?? { linktype: LINKTYPE_ETHERNET, tsresol: 6 };
      if (iface.linktype === LINKTYPE_ETHERNET) {
        packets.push({
          data,
          header: {
            seconds: 0,
            nanoseconds: 0,
            timestampMicroseconds: 0,
            caplen,
            len: origlen,
          },
        });
      }
    }

    offset += blockTotalLen;
  }

  return packets;
}

