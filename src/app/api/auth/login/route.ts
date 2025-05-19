import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { storeJwtInCookie } from '@/app/utils/auth.utils'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

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
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
