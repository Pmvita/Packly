import { describe, expect, it } from 'vitest'
import type { PacketSummary } from '../../src/capture/types'
import { buildDiagnosticReport, formatDiagnosticReport } from '../../src/report/diagnostic'

function packet(partial: Partial<PacketSummary> & { src: string; dstPort: number; rst?: boolean; syn?: boolean }): PacketSummary {
  return {
    timestampMs: 0,
    capturedLength: 64,
    originalLength: 64,
    truncated: false,
    ethernet: null,
    network: {
      version: 4,
      protocol: 'tcp',
      srcAddr: partial.src,
      dstAddr: '10.0.0.2',
    },
    transport: {
      protocol: 'tcp',
      srcPort: 40000,
      dstPort: partial.dstPort,
      flags: {
        ns: false,
        cwr: false,
        ece: false,
        urg: false,
        ack: false,
        psh: false,
        rst: Boolean(partial.rst),
        syn: Boolean(partial.syn),
        fin: false,
      },
    },
  }
}

describe('buildDiagnosticReport', () => {
  it('flags a source that hits many destination ports', () => {
    const packets = Array.from({ length: 20 }, (_, i) => packet({ src: '10.1.1.8', dstPort: 1000 + i }))
    const report = buildDiagnosticReport(packets)
    expect(report.findings.some((item) => item.check === 'port-spread')).toBe(true)
  })

  it('writes a markdown report with a summary', () => {
    const report = buildDiagnosticReport([packet({ src: '10.0.0.1', dstPort: 443 })])
    const text = formatDiagnosticReport(report)
    expect(text).toContain('# Packly diagnostic report')
    expect(text).toContain('Reviewed 1 packet')
  })

  it('flags a TCP RST burst', () => {
    const packets = [
      packet({ src: '10.0.0.8', dstPort: 443, rst: true }),
      packet({ src: '10.0.0.8', dstPort: 443, rst: true }),
      packet({ src: '10.0.0.8', dstPort: 443, rst: true }),
      packet({ src: '10.0.0.8', dstPort: 443 }),
    ]
    const report = buildDiagnosticReport(packets)
    expect(report.findings.some((item) => item.check === 'tcp-rst-burst')).toBe(true)
  })

  it('flags high SYN-without-ACK volume', () => {
    const packets = Array.from({ length: 51 }, () =>
      packet({ src: '10.0.0.9', dstPort: 80, syn: true })
    )
    const report = buildDiagnosticReport(packets)
    expect(report.findings.some((item) => item.check === 'syn-volume')).toBe(true)
  })
})
