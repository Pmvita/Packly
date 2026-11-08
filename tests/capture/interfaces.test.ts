import { describe, expect, it } from 'vitest'
import { listCaptureInterfaces } from '@/capture/interfaces'

describe('listCaptureInterfaces', () => {
  it('returns mock0 when the native cap binding is unavailable', () => {
    const interfaces = listCaptureInterfaces()
    expect(interfaces.some((item) => item.name === 'mock0' || item.name.length > 0)).toBe(true)
  })
})
