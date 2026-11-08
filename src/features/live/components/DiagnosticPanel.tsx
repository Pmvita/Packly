'use client';

import { useMemo, useRef } from 'react';
import type { PacketSummary } from '@/capture/types';
import {
  buildDiagnosticReport,
  formatDiagnosticReport,
} from '@/report/diagnostic';

interface DiagnosticPanelProps {
  packets: PacketSummary[];
  isPlayingSample: boolean;
  onPlaySample: () => void;
  onUploadPcap: (file: File) => void;
}

export function DiagnosticPanel({
  packets,
  isPlayingSample,
  onPlaySample,
  onUploadPcap,
}: DiagnosticPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const report = useMemo(() => buildDiagnosticReport(packets), [packets]);

  const handleExport = () => {
    const text = formatDiagnosticReport(report);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'packly-diagnostic.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--fog)]/65">
          Diagnostic report
        </h3>
        <span className="font-data text-[10px] text-[var(--fog)]/50">
          {report.findings.length} finding
          {report.findings.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="mt-3 text-sm text-[#e8fff7]">{report.summary}</p>
      <ul className="mt-3 space-y-2">
        {report.findings.length === 0 ? (
          <li className="text-xs text-[var(--fog)]/50">
            No scan/RST/SYN thresholds crossed.
          </li>
        ) : (
          report.findings.map((finding) => (
            <li
              key={`${finding.check}-${finding.detail}`}
              className="surface px-3 py-2 text-xs text-[#e8fff7]"
            >
              <span className="font-semibold text-[var(--warn)]">
                [{finding.severity}] {finding.check}
              </span>
              <p className="mt-1 text-[var(--fog)]/70">{finding.detail}</p>
            </li>
          ))
        )}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={packets.length === 0}
          className="btn-ghost !px-3 !py-1.5 text-xs uppercase tracking-wide"
        >
          Export report
        </button>
        <button
          type="button"
          onClick={onPlaySample}
          disabled={isPlayingSample}
          className="btn-ghost !px-3 !py-1.5 text-xs uppercase tracking-wide"
        >
          {isPlayingSample ? 'Loading sample…' : 'Play sample PCAP'}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-ghost !px-3 !py-1.5 text-xs uppercase tracking-wide"
        >
          Open PCAP
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pcap,.cap"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUploadPcap(file);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
