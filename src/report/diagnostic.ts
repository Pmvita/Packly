import type { PacketSummary } from '../capture/types'

export type ReportFinding = {
  check: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  detail: string
}

export type DiagnosticReport = {
  packetCount: number
  protocolCounts: Record<string, number>
  findings: ReportFinding[]
  summary: string
}

const SCAN_PORT_THRESHOLD = 20

export function buildDiagnosticReport(packets: PacketSummary[]): DiagnosticReport {
  const protocolCounts: Record<string, number> = {}
  const destPortsBySrc = new Map<string, Set<number>>()
  let rstCount = 0
  let synNoAck = 0

  for (const packet of packets) {
    const proto = packet.transport?.protocol ?? packet.network?.protocol ?? 'unknown'
    protocolCounts[proto] = (protocolCounts[proto] ?? 0) + 1

    const src = packet.network?.srcAddr
    const dstPort = packet.transport?.dstPort
    if (src && dstPort != null) {
      const ports = destPortsBySrc.get(src) ?? new Set<number>()
      ports.add(dstPort)
      destPortsBySrc.set(src, ports)
    }

    const flags = packet.transport?.flags
    if (flags?.rst) rstCount += 1
    if (flags?.syn && !flags.ack) synNoAck += 1
  }

  const findings: ReportFinding[] = []

  for (const [src, ports] of destPortsBySrc) {
    if (ports.size >= SCAN_PORT_THRESHOLD) {
      findings.push({
        check: 'port-spread',
        severity: 'HIGH',
        detail: `${src} talked to ${ports.size} destination ports in this capture.`,
      })
    }
  }

  if (packets.length > 0 && rstCount / packets.length > 0.2) {
    findings.push({
      check: 'tcp-rst-burst',
      severity: 'MEDIUM',
      detail: `${rstCount} TCP RST packets (${Math.round((rstCount / packets.length) * 100)}% of the capture).`,
    })
  }

  if (synNoAck > 50) {
    findings.push({
      check: 'syn-volume',
      severity: 'MEDIUM',
      detail: `${synNoAck} SYN-without-ACK packets — possible scan or half-open flood.`,
    })
  }

  const summary =
    findings.length === 0
      ? `Reviewed ${packets.length} packet(s). No scan/RST/SYN anomalies crossed the thresholds.`
      : `Reviewed ${packets.length} packet(s). ${findings.length} finding(s) to follow up.`

  return { packetCount: packets.length, protocolCounts, findings, summary }
}

export function formatDiagnosticReport(report: DiagnosticReport): string {
  const protocolLines = Object.entries(report.protocolCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `- ${name}: ${count}`)
    .join('\n')

  const findingLines =
    report.findings.length === 0
      ? '- none'
      : report.findings.map((item) => `- [${item.severity}] ${item.check}: ${item.detail}`).join('\n')

  return [
    '# Packly diagnostic report',
    '',
    report.summary,
    '',
    '## Protocols',
    protocolLines || '- none',
    '',
    '## Findings',
    findingLines,
    '',
  ].join('\n')
}
