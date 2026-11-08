import { encodePcap, type PcapPacket } from './pcap';

function writeUInt16BE(value: number): [number, number] {
  return [(value >> 8) & 0xff, value & 0xff];
}

function ipv4(a: number, b: number, c: number, d: number): number[] {
  return [a, b, c, d];
}

function ethernetIpv4Tcp(options: {
  src: [number, number, number, number];
  dst: [number, number, number, number];
  srcPort: number;
  dstPort: number;
  flags: number;
}): Buffer {
  const [srcPortHi, srcPortLo] = writeUInt16BE(options.srcPort);
  const [dstPortHi, dstPortLo] = writeUInt16BE(options.dstPort);
  return Buffer.from([
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0x00, 0x11, 0x22, 0x33, 0x44, 0x55,
    0x08, 0x00,
    0x45, 0x00, 0x00, 0x28, 0x1c, 0x46, 0x40, 0x00, 0x40, 0x06, 0x00, 0x00,
    ...ipv4(...options.src),
    ...ipv4(...options.dst),
    srcPortHi, srcPortLo,
    dstPortHi, dstPortLo,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x50, options.flags,
    0x71, 0x10, 0x00, 0x00, 0x00, 0x00,
  ]);
}

/** SYN + many dest ports from one host — triggers port-spread in the diagnostic report. */
export function buildSampleScanPcap(): Buffer {
  const packets: PcapPacket[] = [];
  const src: [number, number, number, number] = [10, 1, 1, 8];
  const dst: [number, number, number, number] = [10, 0, 0, 2];

  for (let i = 0; i < 24; i += 1) {
    const data = ethernetIpv4Tcp({
      src,
      dst,
      srcPort: 40000,
      dstPort: 1000 + i,
      flags: 0x02, // SYN
    });
    packets.push({
      data,
      header: {
        seconds: 1_700_000_000 + i,
        nanoseconds: 0,
        timestampMicroseconds: 0,
        caplen: data.length,
        len: data.length,
      },
    });
  }

  for (let i = 0; i < 8; i += 1) {
    const data = ethernetIpv4Tcp({
      src,
      dst,
      srcPort: 40000,
      dstPort: 443,
      flags: 0x04, // RST
    });
    packets.push({
      data,
      header: {
        seconds: 1_700_000_030 + i,
        nanoseconds: 0,
        timestampMicroseconds: 0,
        caplen: data.length,
        len: data.length,
      },
    });
  }

  return encodePcap(packets);
}
