import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET as string

type Role = 'ADMIN' | 'EMPLOYEE' | 'MANAGER'

interface User {
  id: string
  email: string
  role: Role
}

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
    // secure: process.env.NODE_ENV === 'production', // only if we are using HTTPS in production
    path: '/',
  })

  return response
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (req: NextRequest, user: User) => Promise<Record<any, any>>

export function withAuthentication(
  handler: Handler,
  minimumRole: Role = 'EMPLOYEE'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const jwtCookie = request.cookies.get('jwt')?.value || ''
      const user = jwt.verify(jwtCookie, JWT_SECRET) as User
      switch (minimumRole) {
        case 'ADMIN': {
          if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
          break
        }
        case 'MANAGER': {
          if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
          break
        }
        case 'EMPLOYEE': {
          break
        }
      }
      return NextResponse.json(await handler(request, user))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
    } catch (e: any) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
}
