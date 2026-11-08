import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/capture/history/route';

describe('history route', () => {
  it('returns 200 with sessions array', async () => {
    const request = new NextRequest('http://localhost/api/capture/history');
    const res = await GET(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.sessions)).toBe(true);
  });
});
