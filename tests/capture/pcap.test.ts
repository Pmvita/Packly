import { describe, expect, it } from 'vitest';
import { encodePcap, parsePcap } from '@/capture/pcap';
import { buildSampleScanPcap } from '@/capture/sample-pcap';
import { buildDiagnosticReport } from '@/report/diagnostic';

describe('pcap', () => {
  it('round-trips a single ethernet frame', () => {
    const frame = Buffer.from([
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
});
