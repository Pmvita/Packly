'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface ProtocolSummary {
  protocol: string;
  percentage: number;
  count: number;
}

interface ProtocolChartProps {
  protocols: ProtocolSummary[];
}

const PROTOCOL_COLORS: Record<string, string> = {
  tcp: '#38bdf8',
  udp: '#c084fc',
  icmp: '#fcd34d',
  icmpv6: '#f59e0b',
  unknown: '#94a3b8',
};

export function ProtocolChart({ protocols }: ProtocolChartProps) {
  const data = protocols.length
    ? protocols
    : [{ protocol: 'waiting', percentage: 100, count: 0 }];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
      <h3 className="text-lg font-semibold text-slate-100">
        Protocol distribution
      </h3>
      <p className="text-xs uppercase tracking-wide text-slate-400">
        Based on the last {protocols.length ? protocols.reduce((acc, item) => acc + item.count, 0) : 0}{' '}
        packets
      </p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="percentage"
              nameKey="protocol"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={4}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.protocol}
                  fill={PROTOCOL_COLORS[entry.protocol] ?? PROTOCOL_COLORS.unknown}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#020617',
                borderRadius: '0.75rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#e2e8f0',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            />
            <Legend
              align="center"
              verticalAlign="bottom"
              formatter={(value) => value.toUpperCase()}
              wrapperStyle={{
                color: '#94a3b8',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

