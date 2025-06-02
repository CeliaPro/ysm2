import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import { extractInvitePayload, InviteRole, InviteType } from '@/app/utils/invite.utils'
import { storeJwtInCookie } from '@/app/utils/auth.utils'
import { logActivity } from '@/app/utils/logActivity'
import { createSession } from '@/app/utils/session.utils'
import { UAParser } from 'ua-parser-js'
import { Redis } from '@upstash/redis'

// Upstash Redis rate limiting setup
const redis = Redis.fromEnv()
const INVITE_RATE_LIMIT = 5
const INVITE_WINDOW_SECONDS = 600 // 10 minutes

async function checkInviteRateLimit(ip: string) {
  const key = `invite-redeem:rate:${ip}`
  const attempts = (await redis.incr(key)) || 0
  if (attempts === 1) {
    await redis.expire(key, INVITE_WINDOW_SECONDS)
  }
  return attempts > INVITE_RATE_LIMIT
}

export async function POST(req: NextRequest) {
  // --- Rate limit check ---
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    (req as any).ip ||
    'unknown'

  if (await checkInviteRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many activation attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const { token, password, name: nameFromForm } = await req.json()
    // 1) decode token
    let payload: { email: string; name: string; role: InviteRole; type: InviteType }
    try {
      payload = extractInvitePayload(token)
    } catch (err: any) {
      await logActivity({
        action: 'REDEEM_INVITE',
        status: 'FAILURE',
        description: 'Invalid or expired invite token',
        req,
      })
      return NextResponse.json(
        { error: 'Invalid or expired invite token' },
        { status: 400 }
      )
    }

    // 2) Find the invited user
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    })
    if (!user) {
      await logActivity({
        action: 'REDEEM_INVITE',
        status: 'FAILURE',
        description: `No invite found for email ${payload.email}`,
        req,
      })
      return NextResponse.json(
        { error: 'No invite found for this email.' },
        { status: 404 }
      )
    }
    if (payload.type === 'INVITE' && user.status === 'ACTIVE') {
      await logActivity({
        userId: user.id,
        action: 'REDEEM_INVITE',
        status: 'FAILURE',
        description: `User already activated for email ${payload.email}`,
        req,
      })
      return NextResponse.json(
        { error: 'User already activated.' },
        { status: 409 }
      )
    }

    // 3) Update password, set status to ACTIVE, update lastLogin, set name
    const updated = await prisma.user.update({
      where: { email: payload.email },
      data: {
        password: await hash(password, 10),
        status: 'ACTIVE',
        lastLogin: new Date(),
        name: nameFromForm || payload.name || user.name,
      },
    })

    // Device info
    let device: string | undefined = undefined
    const userAgent = req.headers.get('user-agent') || ''
    if (userAgent) {
      const parser = new UAParser(userAgent)
      const parsed = parser.getResult()
      device = [
        parsed.os?.name, parsed.os?.version, '-', parsed.browser?.name, parsed.browser?.version
      ].filter(Boolean).join(' ')
    }

    const sessionId = await createSession(updated.id, req, device)

    await logActivity({
      userId: updated.id,
      action: 'REDEEM_INVITE',
      status: 'SUCCESS',
      description: `User ${updated.email} redeemed invite and activated account`,
      req,
      sessionId,
    })

    const response = storeJwtInCookie({
      id: updated.id,
      email: updated.email,
      role: updated.role,
    })
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error: any) {
    await logActivity({
      action: 'REDEEM_INVITE',
      status: 'FAILURE',
      description: `Internal server error: ${error.message}`,
      req,
    })
    console.error('Redeem error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
