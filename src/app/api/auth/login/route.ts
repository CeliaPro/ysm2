import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { storeJwtInCookie } from '@/app/utils/auth.utils'
import { logActivity } from '@/app/utils/logActivity'
import { createSession } from '@/app/utils/session.utils'
import UAParser from 'ua-parser-js'
const UAParserConstructor = (UAParser as any).UAParser || UAParser
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      await logActivity({
        action: 'LOGIN',
        status: 'FAILURE',
        description: 'Missing email or password',
        req,
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
      })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Device info
    let device: string | undefined = undefined
    const userAgent = req.headers.get('user-agent') || ''
    if (userAgent) {
        const parser = new UAParserConstructor(userAgent)
        const parsed = parser.getResult()
      device = [
        parsed.os?.name, parsed.os?.version, '-', parsed.browser?.name, parsed.browser?.version
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
    })
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
