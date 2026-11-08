import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/capture/history/route';

describe('history route', () => {
  it('returns 200 with sessions array', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.sessions)).toBe(true);
  });
});
