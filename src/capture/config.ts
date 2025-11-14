import { CaptureConfig, CaptureOptions, CaptureError } from './types';

const DEFAULT_DEVICE = process.env.CAPTURE_INTERFACE ?? '';
const DEFAULT_FILTER = process.env.CAPTURE_FILTER ?? '';

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export const DEFAULT_CAPTURE_CONFIG: CaptureConfig = {
  device: DEFAULT_DEVICE,
  filter: DEFAULT_FILTER,
  snapLength: parseNumber(process.env.CAPTURE_SNAPSHOT_LENGTH, 65_535),
  bufferSize: parseNumber(process.env.CAPTURE_BUFFER_SIZE, 10 * 1024 * 1024),
  promiscuous: parseBoolean(process.env.CAPTURE_PROMISCUOUS, true),
  minBytesForRead: parseNumber(process.env.CAPTURE_MIN_BYTES, 0),
};

export function resolveCaptureConfig(
  options: CaptureOptions = {}
): CaptureConfig {
  const device = options.device ?? DEFAULT_CAPTURE_CONFIG.device;
  if (!device) {
    throw new CaptureError(
      'CAPTURE_DEVICE_UNDEFINED',
      'No capture device provided. Set CAPTURE_INTERFACE or pass a device name.'
    );
  }

  return {
    device,
    filter: options.filter ?? DEFAULT_CAPTURE_CONFIG.filter,
    snapLength: options.snapLength ?? DEFAULT_CAPTURE_CONFIG.snapLength,
    bufferSize: options.bufferSize ?? DEFAULT_CAPTURE_CONFIG.bufferSize,
    promiscuous: options.promiscuous ?? DEFAULT_CAPTURE_CONFIG.promiscuous,
    minBytesForRead:
      options.minBytesForRead ?? DEFAULT_CAPTURE_CONFIG.minBytesForRead,
  };
}

