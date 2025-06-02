import { prisma } from '@/lib/prisma'
import { getIpAddress } from '@/app/utils/geoip'

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days


export async function createSession(userId: string, req: any, device?: string) {
  const ipAddress = getIpAddress(req)
  let geoCountry: string | null = null
  let geoCity: string | null = null
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS)

  // GeoIP lookup (optional, ignore local/dev addresses)
  if (
    ipAddress &&
    ipAddress !== '::1' &&
    ipAddress !== '127.0.0.1' &&
    !ipAddress.startsWith('192.168.') &&
    !ipAddress.startsWith('10.')
  ) {
    try {
      // Free API – limit for dev/test, use paid for prod
      const resp = await fetch(`https://ipapi.co/${ipAddress}/json/`)
      if (resp.ok) {
        const data = await resp.json()
        geoCountry = data.country_name || null
        geoCity = data.city || null
      }
    } catch {}
  }

  const session = await prisma.session.create({
    data: {
      userId,
      device: device ?? null,
      ipAddress,
      geoCountry,
      geoCity,
      expiresAt,
    },
  })
  return session.id
}
