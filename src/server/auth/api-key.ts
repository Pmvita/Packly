import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export function isAuthConfigured(): boolean {
  return Boolean(process.env.PACKLY_API_KEY?.trim());
}

export function extractApiKey(request: NextRequest): string | null {
  const headerKey = request.headers.get('x-api-key')?.trim();
  if (headerKey) return headerKey;

  const auth = request.headers.get('authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 32);
}

export type AuthResult =
  | { ok: true; ownerApiKey: string | null }
  | { ok: false; response: NextResponse };

/**
 * Protects capture start/stop and history when PACKLY_API_KEY is set.
 * When unset (local demo), requests are allowed; an optional client key still
 * scopes history ownership.
 */
export function authorizeCaptureRequest(request: NextRequest): AuthResult {
  const configured = process.env.PACKLY_API_KEY?.trim();
  const provided = extractApiKey(request);

  if (!configured) {
    return {
      ok: true,
      ownerApiKey: provided ? hashApiKey(provided) : null,
    };
  }

  if (!provided || provided !== configured) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Unauthorized',
          details:
            'Provide a valid API key via X-API-Key or Authorization: Bearer.',
        },
        { status: 401 }
      ),
    };
  }

  return { ok: true, ownerApiKey: hashApiKey(provided) };
}
