// app/utils/auth.utils.ts
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // Import prisma if you're checking sessions

const JWT_SECRET = process.env.JWT_SECRET as string

type Role = 'ADMIN' | 'EMPLOYEE' | 'MANAGER'
interface User { id: string; email: string; role: Role }

export function storeJwtInCookie(user: User) {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  const response = NextResponse.json({ success: true })

  response.cookies.set('jwt', token, {
    httpOnly: true,
    sameSite: 'lax',
    // secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  return response
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (req: NextRequest, user: User) => Promise<any>

export function withAuthentication(
  handler: Handler,
  minimumRole: Role = 'EMPLOYEE'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // 1) verify token
    const token = request.cookies.get('jwt')?.value
    const sessionId = request.cookies.get('sessionId')?.value

    if (!token || !sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user: User
    try {
      user = jwt.verify(token, JWT_SECRET) as User
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2) Check session validity & expiration
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    const now = new Date()
    if (!session || (session.expiresAt && now > session.expiresAt)) {
      // Expired or missing session: clear cookies and reject
      const response = NextResponse.json({ error: 'Session expired' }, { status: 401 })
      response.cookies.set('jwt', '', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        expires: new Date(0),
      })
      response.cookies.set('sessionId', '', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        expires: new Date(0),
      })
      return response
    }

    // 3) check roles
    if (
      (minimumRole === 'MANAGER' && !['ADMIN', 'MANAGER'].includes(user.role)) ||
      (minimumRole === 'ADMIN' && user.role !== 'ADMIN')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4) call handler
    const result = await handler(request, user)

    // 5) if handler already gave us a NextResponse, use it
    if (result instanceof NextResponse) {
      return result
    }

    // 6) otherwise JSON-serialize the plain object
    return NextResponse.json(result)
  }
}
