import { prisma } from '@/lib/prisma'
import * as UAParserNS from 'ua-parser-js'
import type { NextRequest } from 'next/server'
import { withAuthentication } from '@/app/utils/auth.utils' // Uncomment if using authentication middleware  


const UAParser = UAParserNS.UAParser


interface LogActivityOptions {
  userId?: string
  action: string
  status: 'SUCCESS' | 'FAILURE'
  description?: string
  req?: any
  sessionId?: string
}

function getIpAddress(req: any): string {
  let ip =
    req?.headers?.['x-forwarded-for'] ||
    req?.headers?.get?.('x-forwarded-for') ||
    req?.headers?.['x-real-ip'] ||
    req?.headers?.get?.('x-real-ip') ||
    req?.socket?.remoteAddress ||
    req?.ip ||
    ''
  if (Array.isArray(ip)) ip = ip[0]
  if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim()
  return ip
}

export async function logActivity({
  userId,
  action,
  status,
  description,
  req,
  sessionId,
}: LogActivityOptions) {
  const userAgent =
    req?.headers?.['user-agent'] ||
    req?.headers?.get?.('user-agent') ||
    ''

  // Parse device info
  let device = ''
  if (userAgent) {
    try {
      const parser = new UAParser(userAgent)
      const result = parser.getResult()
      device = [
        result.os?.name,
        result.os?.version,
        '-',
        result.browser?.name,
        result.browser?.version,
      ]
        .filter(Boolean)
        .join(' ')
    } catch {}
  }

  const ipAddress = getIpAddress(req)

  await prisma.activityLog.create({
    data: {
      userId,
      action,
      status,
      description,
      ipAddress,
      userAgent,
      device,
      sessionId,
      // geoCountry: country, // if you implement geo lookup
      // geoCity: city,
    },
  })
}
