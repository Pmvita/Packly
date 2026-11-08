import { NextRequest, NextResponse } from 'next/server';
import { parsePcap } from '@/capture/pcap';
import { buildSampleScanPcap } from '@/capture/sample-pcap';
import {
  buildDiagnosticReport,
  formatDiagnosticReport,
} from '@/report/diagnostic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

function toPayload(buffer: Buffer) {
  const packets = parsePcap(buffer);
  const report = buildDiagnosticReport(packets);
  return {
    packetCount: packets.length,
    packets,
    report,
    markdown: formatDiagnosticReport(report),
  };
}

export async function GET() {
  try {
    return NextResponse.json(toPayload(buildSampleScanPcap()));
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to build sample pcap',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const bytes = Buffer.from(await request.arrayBuffer());
    if (bytes.length === 0) {
      return NextResponse.json(
        { error: 'Empty pcap upload' },
        { status: 400 }
      );
    }
    if (bytes.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Pcap exceeds 2 MB limit' },
        { status: 413 }
      );
    }
    return NextResponse.json(toPayload(bytes));
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to parse pcap',
        details: (error as Error).message,
      },
      { status: 400 }
    );
  }
}
