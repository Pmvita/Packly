import { describe, expect, it } from 'vitest';
import { parsePacketSummary } from '@/capture/parsers';

describe('parsePacketSummary', () => {
  it('decodes IPv4 TCP packets', () => {
    const frame = Buffer.from([
      // Ethernet
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, // dst
      0x00, 0x11, 0x22, 0x33, 0x44, 0x55, // src
      0x08, 0x00, // EtherType IPv4
      // IPv4 header
      0x45, // version + ihl
      0x00, // dscp/ecn
      0x00, 0x28, // total length 40 bytes
      0x1c, 0x46, // identification
      0x40, 0x00, // flags + fragment offset
      0x40, // ttl
      0x06, // protocol TCP
      0x00, 0x00, // checksum
      0xc0, 0xa8, 0x00, 0x0a, // source 192.168.0.10
      0xc0, 0xa8, 0x00, 0x01, // dest 192.168.0.1
      // TCP header
      0x00, 0x50, // src port 80
      0x23, 0x29, // dst port 9001
      0x00, 0x00, 0x00, 0x00, // sequence
      0x00, 0x00, 0x00, 0x00, // ack
      0x50, 0x02, // data offset + flags (SYN)
      0x71, 0x10, // window size
      0x00, 0x00, // checksum
      0x00, 0x00, // urgent pointer
    ]);

    const summary = parsePacketSummary(frame, {
      seconds: 1,
      nanoseconds: 500_000_000,
      caplen: frame.length,
      len: frame.length,
    });

    expect(summary.timestampMs).toBe(1500);
    expect(summary.ethernet?.srcMac).toBe('00:11:22:33:44:55');
    expect(summary.ethernet?.dstMac).toBe('ff:ff:ff:ff:ff:ff');
    expect(summary.network?.version).toBe(4);
    expect(summary.network?.srcAddr).toBe('192.168.0.10');
    expect(summary.network?.dstAddr).toBe('192.168.0.1');
    expect(summary.transport?.protocol).toBe('tcp');
    expect(summary.transport?.srcPort).toBe(80);
    expect(summary.transport?.dstPort).toBe(9001);
    expect(summary.transport?.flags?.syn).toBe(true);
    expect(summary.truncated).toBe(false);
  });

  it('marks packets as truncated when captured length is shorter', () => {
    const frame = Buffer.alloc(60);
    const summary = parsePacketSummary(frame, {
      seconds: 2,
      nanoseconds: 0,
      caplen: 30,
      len: 60,
    });

    expect(summary.truncated).toBe(true);
    expect(summary.originalLength).toBe(60);
    expect(summary.capturedLength).toBe(30);
  });
});

