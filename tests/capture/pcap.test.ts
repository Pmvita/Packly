import { describe, expect, it } from 'vitest';
import { encodePcap, parsePcap, parsePcapRecords } from '@/capture/pcap';
import { buildSampleScanPcap } from '@/capture/sample-pcap';
import { buildDiagnosticReport } from '@/report/diagnostic';
import { CaptureError } from '@/capture/types';

/** Minimal Ethernet frame (broadcast ARP-like IPv4/TCP SYN stub). */
function sampleFrame(): Buffer {
  return Buffer.from([
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0x00, 0x11, 0x22, 0x33, 0x44, 0x55,
    0x08, 0x00,
    0x45, 0x00, 0x00, 0x28, 0x1c, 0x46, 0x40, 0x00, 0x40, 0x06, 0x00, 0x00,
    0xc0, 0xa8, 0x00, 0x0a,
    0xc0, 0xa8, 0x00, 0x01,
    0x00, 0x50, 0x23, 0x29,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x50, 0x02, 0x71, 0x10, 0x00, 0x00, 0x00, 0x00,
  ]);
}

/**
 * Builds a tiny little-endian pcapng with SHB + IDB + one EPB.
 */
function buildMinimalPcapng(frame: Buffer): Buffer {
  const shbBody = Buffer.alloc(16);
  shbBody.writeUInt32LE(0x1a2b3c4d, 0); // byte-order magic
  shbBody.writeUInt16LE(1, 4); // major
  shbBody.writeUInt16LE(0, 6); // minor
  shbBody.writeBigInt64LE(BigInt(-1), 8); // section length unknown

  const shbLen = 8 + shbBody.length + 4;
  const shb = Buffer.alloc(shbLen);
  shb.writeUInt32LE(0x0a0d0d0a, 0);
  shb.writeUInt32LE(shbLen, 4);
  shbBody.copy(shb, 8);
  shb.writeUInt32LE(shbLen, shbLen - 4);

  const idbBody = Buffer.alloc(8);
  idbBody.writeUInt16LE(1, 0); // LINKTYPE_ETHERNET
  idbBody.writeUInt16LE(0, 2);
  idbBody.writeUInt32LE(65535, 4);
  const idbLen = 8 + idbBody.length + 4;
  const idb = Buffer.alloc(idbLen);
  idb.writeUInt32LE(0x00000001, 0);
  idb.writeUInt32LE(idbLen, 4);
  idbBody.copy(idb, 8);
  idb.writeUInt32LE(idbLen, idbLen - 4);

  const paddedCap = (frame.length + 3) & ~3;
  const epbBodyLen = 20 + paddedCap;
  const epbLen = 8 + epbBodyLen + 4;
  const epb = Buffer.alloc(epbLen);
  epb.writeUInt32LE(0x00000006, 0);
  epb.writeUInt32LE(epbLen, 4);
  epb.writeUInt32LE(0, 8); // iface id
  epb.writeUInt32LE(0, 12); // ts high
  epb.writeUInt32LE(1_000_000, 16); // ts low (1s at µs resol)
  epb.writeUInt32LE(frame.length, 20);
  epb.writeUInt32LE(frame.length, 24);
  frame.copy(epb, 28);
  epb.writeUInt32LE(epbLen, epbLen - 4);

  return Buffer.concat([shb, idb, epb]);
}

describe('pcap', () => {
  it('round-trips a single ethernet frame', () => {
    const frame = sampleFrame();
    const file = encodePcap([
      {
        data: frame,
        header: {
          seconds: 10,
          nanoseconds: 2_000_000,
          timestampMicroseconds: 2000,
          caplen: frame.length,
          len: frame.length,
        },
      },
    ]);
    const packets = parsePcap(file);
    expect(packets).toHaveLength(1);
    expect(packets[0].network?.srcAddr).toBe('192.168.0.10');
    expect(packets[0].transport?.flags?.syn).toBe(true);
  });

  it('flags port-spread on the bundled scan sample', () => {
    const packets = parsePcap(buildSampleScanPcap());
    const report = buildDiagnosticReport(packets);
    expect(packets.length).toBeGreaterThan(20);
    expect(report.findings.some((item) => item.check === 'port-spread')).toBe(
      true
    );
    expect(report.findings.some((item) => item.check === 'tcp-rst-burst')).toBe(
      true
    );
  });

  it('parses a minimal pcapng fixture', () => {
    const frame = sampleFrame();
    const file = buildMinimalPcapng(frame);
    const records = parsePcapRecords(file);
    expect(records).toHaveLength(1);
    expect(records[0].data.equals(frame)).toBe(true);

    const packets = parsePcap(file);
    expect(packets).toHaveLength(1);
    expect(packets[0].network?.srcAddr).toBe('192.168.0.10');
    expect(packets[0].transport?.flags?.syn).toBe(true);
  });

  it('rejects unrecognized classic magic without claiming pcapng unsupported', () => {
    const junk = Buffer.alloc(24, 0xab);
    try {
      parsePcapRecords(junk);
      expect.unreachable('expected CaptureError');
    } catch (error) {
      expect(error).toBeInstanceOf(CaptureError);
      const message = (error as CaptureError).message;
      expect(message).toMatch(/Unrecognized capture file magic/i);
      expect(message.toLowerCase()).not.toContain('pcapng is not supported');
    }
  });
});
