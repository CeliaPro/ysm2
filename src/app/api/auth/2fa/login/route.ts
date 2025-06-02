import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { storeJwtInCookie } from '@/app/utils/auth.utils'
import { createSession } from '@/app/utils/session.utils'
import { logActivity } from '@/app/utils/logActivity'
import { UAParser } from 'ua-parser-js'
import { authenticator } from 'otplib'

export async function POST(req: NextRequest) {
  const { userId, code } = await req.json()
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    (req as any).ip ||
    'unknown'
  const userAgent = req.headers.get('user-agent') || ''

  // 1. Fetch user and verify they have 2FA enabled
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.twoFaEnabled || !user.twoFaSecret) {
    await logActivity({
      userId,
      action: 'LOGIN_2FA',
      status: 'FAILURE',
      description: '2FA not enabled or user not found during 2FA login',
      req,
      ip,
      userAgent,
    })
    return NextResponse.json({ error: '2FA not enabled for this user.' }, { status: 400 })
  }

  // 2. Verify the 2FA code
  const isValid = authenticator.check(code, user.twoFaSecret)
  if (!isValid) {
    await logActivity({
      userId,
      action: 'LOGIN_2FA',
      status: 'FAILURE',
      description: 'Invalid 2FA code provided at login',
      req,
      ip,
      userAgent,
    })
    return NextResponse.json({ error: 'Invalid 2FA code.' }, { status: 401 })
  }

  // 3. Set session/JWT and log success
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  let device: string | undefined = undefined
  if (userAgent) {
    const parser = new UAParser(userAgent)
    const parsed = parser.getResult()
    device = [
      parsed.os?.name,
      parsed.os?.version,
      '-',
      parsed.browser?.name,
      parsed.browser?.version,
    ].filter(Boolean).join(' ')
  }

  const sessionId = await createSession(user.id, req, device)

  await logActivity({
    userId: user.id,
    action: 'LOGIN_2FA',
    status: 'SUCCESS',
    description: 'User successfully logged in with 2FA',
    req,
    sessionId,
    ip,
    userAgent,
    device,
  })

  const response = storeJwtInCookie({
    id: user.id,
    email: user.email,
    role: user.role,
  })
  response.cookies.set('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  return NextResponse.redirect(new URL('/dashboard', req.url), {
    status: 302,
    headers: response.headers,
  })
}
