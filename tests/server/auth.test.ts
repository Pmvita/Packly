import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import {
  authorizeCaptureRequest,
  hashApiKey,
  isAuthConfigured,
} from '@/server/auth/api-key';

describe('api-key auth', () => {
  const original = process.env.PACKLY_API_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PACKLY_API_KEY;
    } else {
      process.env.PACKLY_API_KEY = original;
    }
  });

  it('reports auth as optional when PACKLY_API_KEY is unset', () => {
    delete process.env.PACKLY_API_KEY;
    expect(isAuthConfigured()).toBe(false);

    const request = new NextRequest('http://localhost/api/capture/start', {
      method: 'POST',
    });
    const result = authorizeCaptureRequest(request);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ownerApiKey).toBeNull();
    }
  });

  it('scopes ownership from optional client key when auth is unset', () => {
    delete process.env.PACKLY_API_KEY;
    const request = new NextRequest('http://localhost/api/capture/history', {
      headers: { 'x-api-key': 'demo-key' },
    });
    const result = authorizeCaptureRequest(request);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ownerApiKey).toBe(hashApiKey('demo-key'));
    }
  });

  it('rejects missing key when PACKLY_API_KEY is configured', async () => {
    process.env.PACKLY_API_KEY = 'secret-packly';
    const request = new NextRequest('http://localhost/api/capture/start', {
      method: 'POST',
    });
    const result = authorizeCaptureRequest(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body.error).toBe('Unauthorized');
    }
  });

  it('accepts matching X-API-Key and hashes ownership', () => {
    process.env.PACKLY_API_KEY = 'secret-packly';
    const request = new NextRequest('http://localhost/api/capture/history', {
      headers: { 'x-api-key': 'secret-packly' },
    });
    const result = authorizeCaptureRequest(request);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ownerApiKey).toBe(hashApiKey('secret-packly'));
    }
  });

  it('accepts Authorization Bearer', () => {
    process.env.PACKLY_API_KEY = 'secret-packly';
    const request = new NextRequest('http://localhost/api/capture/stop', {
      method: 'POST',
      headers: { authorization: 'Bearer secret-packly' },
    });
    const result = authorizeCaptureRequest(request);
    expect(result.ok).toBe(true);
  });
});
