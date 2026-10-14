import { describe, expect, it } from 'vitest'
import { adsTxtLine, robotsTxt } from '../scripts/generateHostFiles.mjs'

describe('generateHostFiles', () => {
  it('writes a direct ads.txt line and strips the ca- prefix', () => {
    expect(adsTxtLine('ca-pub-1234567890123456', 'true')).toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n',
    )
  })

  it('skips ads.txt when ads are off or the id is not a publisher id', () => {
    expect(adsTxtLine('ca-pub-123', 'false')).toBeNull()
    expect(adsTxtLine('home-mid', 'true')).toBeNull()
    expect(adsTxtLine('', 'true')).toBeNull()
  })

  it('points robots.txt at the configured site', () => {
    expect(robotsTxt('https://example.vercel.app/')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://example.vercel.app/sitemap.xml\n',
    )
  })
})
