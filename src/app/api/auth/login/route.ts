import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { storeJwtInCookie } from '@/app/utils/auth.utils'
import { logActivity } from '@/app/utils/logActivity' // <-- Import your logger

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      // Log missing fields as a failed attempt (no userId, only email)
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
      // Log invalid credentials (no user found)
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
      // Log invalid credentials (wrong password)
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

    // 👇 ADD THIS: update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Log successful login
    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      status: 'SUCCESS',
      description: 'User logged in successfully',
      req,
    })

    // Set the cookie
    const response = storeJwtInCookie({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    // Redirect to /dashboard with cookie headers
    return NextResponse.redirect(new URL('/dashboard', req.url), {
      status: 302,
      headers: response.headers, // preserve Set-Cookie
    })
  } catch (error: any) {
    console.error('Login error:', error)
    // Log unexpected server error
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
