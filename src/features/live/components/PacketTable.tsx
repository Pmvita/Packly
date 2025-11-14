'use client';

import type { PacketSummary } from '@/capture';

interface PacketTableProps {
  packets: PacketSummary[];
}

export function PacketTable({ packets }: PacketTableProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            Live packet stream
          </h3>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Showing newest {packets.length} packets
          </p>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Destination</th>
              <th className="px-4 py-3 text-left">Protocol</th>
              <th className="px-4 py-3 text-right">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/80 bg-slate-950/40">
            {packets.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-5 text-center text-xs text-slate-500"
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
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                      {new Date(packet.timestampMs).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <AddressCell
                        ip={packet.network?.srcAddr}
                        port={packet.transport?.srcPort}
                        mac={packet.ethernet?.srcMac}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <AddressCell
                        ip={packet.network?.dstAddr}
                        port={packet.transport?.dstPort}
                        mac={packet.ethernet?.dstMac}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ProtocolBadge protocol={packet.transport?.protocol ?? 'unknown'} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
                      {packet.originalLength} B
                      {packet.truncated ? (
                        <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] uppercase text-amber-300">
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
      <span className="font-medium text-slate-200">
        {ip ?? mac ?? '—'}
        {port != null ? `:${port}` : ''}
      </span>
      {mac && ip ? (
        <span className="font-mono text-[10px] uppercase text-slate-500">
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${variant.bg} ${variant.text}`}
    >
      {protocol}
    </span>
  );
}

function getProtocolVariant(protocol: string) {
  switch (protocol) {
    case 'tcp':
      return { bg: 'bg-sky-500/15 border border-sky-500/40', text: 'text-sky-200' };
    case 'udp':
      return { bg: 'bg-purple-500/15 border border-purple-500/40', text: 'text-purple-200' };
    case 'icmp':
    case 'icmpv6':
      return { bg: 'bg-amber-500/15 border border-amber-500/40', text: 'text-amber-200' };
    default:
      return { bg: 'bg-slate-500/15 border border-slate-500/40', text: 'text-slate-200' };
  }
}

