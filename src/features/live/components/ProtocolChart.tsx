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
  tcp: '#3DFFC8',
  udp: '#A8C5BC',
  icmp: '#F0A202',
  icmpv6: '#F0A202',
  unknown: '#6a8f84',
  waiting: '#132420',
};

export function ProtocolChart({ protocols }: ProtocolChartProps) {
  const data = protocols.length
    ? protocols
    : [{ protocol: 'waiting', percentage: 100, count: 0 }];

  return (
    <div className="panel p-5">
      <h3 className="font-display text-base font-semibold text-[#e8fff7]">
        Protocol distribution
      </h3>
      <p className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--fog)]/60">
        Based on the last{' '}
        {protocols.length
          ? protocols.reduce((acc, item) => acc + item.count, 0)
          : 0}{' '}
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
                backgroundColor: '#071210',
                borderRadius: '0',
                border: '1px solid rgba(61, 255, 200, 0.14)',
                color: '#A8C5BC',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-ibm-plex-mono), monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            />
            <Legend
              align="center"
              verticalAlign="bottom"
              formatter={(value) => value.toUpperCase()}
              wrapperStyle={{
                color: '#A8C5BC',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-ibm-plex-mono), monospace',
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
