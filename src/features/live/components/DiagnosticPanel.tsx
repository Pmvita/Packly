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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/50">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Diagnostic report
        </h3>
        <span className="text-xs text-slate-500">
          {report.findings.length} finding
          {report.findings.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-200">{report.summary}</p>
      <ul className="mt-3 space-y-2">
        {report.findings.length === 0 ? (
          <li className="text-xs text-slate-500">No scan/RST/SYN thresholds crossed.</li>
        ) : (
          report.findings.map((finding) => (
            <li
              key={`${finding.check}-${finding.detail}`}
              className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200"
            >
              <span className="font-semibold text-amber-300">
                [{finding.severity}] {finding.check}
              </span>
              <p className="mt-1 text-slate-400">{finding.detail}</p>
            </li>
          ))
        )}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={packets.length === 0}
          className="rounded-full border border-slate-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
        >
          Export report
        </button>
        <button
          type="button"
          onClick={onPlaySample}
          disabled={isPlayingSample}
          className="rounded-full border border-slate-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
        >
          {isPlayingSample ? 'Loading sample…' : 'Play sample PCAP'}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-slate-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
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
