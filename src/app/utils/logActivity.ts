import { prisma } from '@/lib/prisma'
import { UAParser } from 'ua-parser-js'
import type { NextRequest } from 'next/server'

export interface LogActivityOptions {
  userId?: string
  action: string
  status: 'SUCCESS' | 'FAILURE' | '2FA_REQUIRED' | 'PENDING' | string
  description?: string
  req?: any
  sessionId?: string
  device?: string
  ip?: string
  userAgent?: string
}

function getIpAddress(req: any): string | undefined {
  if (!req) return undefined
  let ip =
    req.headers?.['x-forwarded-for'] ||
    req.headers?.get?.('x-forwarded-for') ||
    req.headers?.['x-real-ip'] ||
    req.headers?.get?.('x-real-ip') ||
    req.socket?.remoteAddress ||
    req.ip ||
    ''
  if (Array.isArray(ip)) ip = ip[0]
  if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim()
  return ip || undefined
}

function getUserAgent(req: any): string | undefined {
  if (!req) return undefined
  return (
    req.headers?.['user-agent'] ||
    req.headers?.get?.('user-agent') ||
    undefined
  )
}

function getDevice(userAgent: string | undefined): string | undefined {
  if (!userAgent) return undefined
  try {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()
    return [
      result.os?.name,
      result.os?.version,
      '-',
      result.browser?.name,
      result.browser?.version,
    ]
      .filter(Boolean)
      .join(' ')
  } catch {
    return undefined
  }
}

export async function logActivity({
  userId,
  action,
  status,
  description,
  req,
  sessionId,
  device,
  ip,
  userAgent,
}: LogActivityOptions) {
  // Use passed values or fallback to request
  const finalUserAgent = userAgent || getUserAgent(req)
  const finalIp = ip || getIpAddress(req)
  const finalDevice = device || getDevice(finalUserAgent)

  await prisma.activityLog.create({
    data: {
      userId,
      action,
      status,
      description,
      ipAddress: finalIp,
      userAgent: finalUserAgent,
      device: finalDevice,
      sessionId,
    },
  })
}
