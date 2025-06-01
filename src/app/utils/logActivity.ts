import { prisma } from '@/lib/prisma' // Adjust if needed
import * as UAParser from 'ua-parser-js'

interface LogActivityOptions {
  userId?: string
  action: string
  status: 'SUCCESS' | 'FAILURE'
  description?: string
  req?: any
}

export async function logActivity({
  userId,
  action,
  status,
  description,
  req,
}: LogActivityOptions) {
  const userAgent =
    req?.headers?.['user-agent'] ||
    req?.headers?.get?.('user-agent') ||
    ''

  const ipAddress =
    req?.headers?.['x-forwarded-for'] ||
    req?.socket?.remoteAddress ||
    req?.ip ||
    ''

  let device = ''
  if (userAgent) {
    const parser = new UAParser.UAParser(userAgent)
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
  }

  await prisma.activityLog.create({
    data: {
      userId,
      action,
      status,
      description,
      ipAddress:
        typeof ipAddress === 'string'
          ? ipAddress
          : Array.isArray(ipAddress)
            ? ipAddress[0]
            : '',
      device,
      userAgent,
    },
  })
}
