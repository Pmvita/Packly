'use client';

import type { PacketSummary } from '@/capture';

interface PacketTableProps {
  packets: PacketSummary[];
}

export function PacketTable({ packets }: PacketTableProps) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-[#e8fff7]">
            Live packet stream
          </h3>
          <p className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--fog)]/60">
            Showing newest {packets.length} packets
          </p>
        </div>
        <span className="status-pulse" data-state={packets.length ? 'online' : 'offline'} />
      </div>
      <div className="mt-3 overflow-hidden border border-[var(--line)]">
        <table className="ops-table min-w-full">
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Protocol</th>
              <th className="!text-right">Size</th>
            </tr>
          </thead>
          <tbody>
            {packets.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-8 text-center text-[var(--fog)]/45"
                  colSpan={5}
                >
                  Waiting for packets…
                </td>
              </tr>
            ) : (
              [...packets]
                .reverse()
                .map((packet, index) => (
                  <tr
                    key={`${packet.timestampMs}-${packet.originalLength}-${index}`}
                    className="row-enter"
                    style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
                  >
                    <td className="whitespace-nowrap text-[var(--fog)]/70">
                      {new Date(packet.timestampMs).toLocaleTimeString()}
                    </td>
                    <td>
                      <AddressCell
                        ip={packet.network?.srcAddr}
                        port={packet.transport?.srcPort}
                        mac={packet.ethernet?.srcMac}
                      />
                    </td>
                    <td>
                      <AddressCell
                        ip={packet.network?.dstAddr}
                        port={packet.transport?.dstPort}
                        mac={packet.ethernet?.dstMac}
                      />
                    </td>
                    <td>
                      <ProtocolBadge protocol={packet.transport?.protocol ?? 'unknown'} />
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {packet.originalLength} B
                      {packet.truncated ? (
                        <span className="ml-2 border border-[rgba(240,162,2,0.35)] bg-[rgba(240,162,2,0.12)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--warn)]">
                          truncated
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddressCell({
  ip,
  port,
  mac,
}: {
  ip?: string | null;
  port?: number | null;
  mac?: string | null;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[#e8fff7]">
        {ip ?? mac ?? '—'}
        {port != null ? `:${port}` : ''}
      </span>
      {mac && ip ? (
        <span className="text-[10px] uppercase tracking-wide text-[var(--fog)]/45">
          {mac}
        </span>
      ) : null}
    </div>
  );
}

function ProtocolBadge({ protocol }: { protocol: string }) {
  const variant = getProtocolVariant(protocol);
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${variant.bg} ${variant.text} ${variant.border}`}
    >
      {protocol}
    </span>
  );
}

function getProtocolVariant(protocol: string) {
  switch (protocol) {
    case 'tcp':
      return {
        bg: 'bg-[rgba(61,255,200,0.1)]',
        border: 'border-[rgba(61,255,200,0.35)]',
        text: 'text-[var(--phosphor)]',
      };
    case 'udp':
      return {
        bg: 'bg-[rgba(168,197,188,0.1)]',
        border: 'border-[rgba(168,197,188,0.35)]',
        text: 'text-[var(--fog)]',
      };
    case 'icmp':
    case 'icmpv6':
      return {
        bg: 'bg-[rgba(240,162,2,0.1)]',
        border: 'border-[rgba(240,162,2,0.35)]',
        text: 'text-[var(--warn)]',
      };
    default:
      return {
        bg: 'bg-[rgba(255,255,255,0.04)]',
        border: 'border-[var(--line)]',
        text: 'text-[var(--fog)]',
      };
  }
}
