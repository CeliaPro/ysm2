import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { storeJwtInCookie } from '@/app/utils/auth.utils'
import { logActivity } from '@/app/utils/logActivity'
import { createSession } from '@/app/utils/session.utils'
import { UAParser } from 'ua-parser-js'
import { Redis } from '@upstash/redis'

// Redis setup (uses env vars)
const redis = Redis.fromEnv()
const RATE_LIMIT = 10
const WINDOW_SECONDS = 60

async function checkRateLimit(ip: string) {
  const key = `login:rate:${ip}`
  const attempts = (await redis.incr(key)) || 0
  if (attempts === 1) {
    await redis.expire(key, WINDOW_SECONDS)
  }
  return attempts > RATE_LIMIT
}

// ...imports and setup...

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    (req as any).ip ||
    'unknown'

  if (await checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait and try again.' },
      { status: 429 }
    )
  }

  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      await logActivity({
        action: 'LOGIN',
        status: 'FAILURE',  // FIXED HERE!
        description: 'Missing email or password',
        req,
        ip,
      })
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      await logActivity({
        action: 'LOGIN',
        status: 'FAILURE',
        description: `Login failed: email not found (${email})`,
        req,
        ip,
      })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      await logActivity({
        userId: user.id,
        action: 'LOGIN',
        status: 'FAILURE',
        description: `Login failed: wrong password`,
        req,
        ip,
      })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // --- DEBUG 2FA ---
    console.log('2FA DEBUG', user.twoFaEnabled, typeof user.twoFaEnabled);

    // 🔒 ENFORCE 2FA IF ENABLED
    if (user.twoFaEnabled === true) {
      await logActivity({
        userId: user.id,
        action: 'LOGIN',
        status: '2FA_REQUIRED', // Or FAILURE if you want, see note above
        description: '2FA required for user login',
        req,
        ip,
      })
      return NextResponse.json({
        twoFaRequired: true,
        userId: user.id,
      })
    }

    // 2FA not enabled, proceed as usual
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    let device: string | undefined = undefined
    const userAgent = req.headers.get('user-agent') || ''
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
      action: 'LOGIN',
      status: 'SUCCESS',
      description: 'User logged in successfully',
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
  } catch (error: any) {
    console.error('Login error:', error)
    await logActivity({
      action: 'LOGIN',
      status: 'FAILURE',
      description: `Internal server error during login: ${error.message}`,
      req,
      ip,
    })
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
