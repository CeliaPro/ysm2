// app/utils/auth.utils.ts
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

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
    // secure: process.env.NODE_ENV === 'production', // only if we are using HTTPS in production
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
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user: User
    try {
      user = jwt.verify(token, JWT_SECRET) as User
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2) check roles
    if (
      (minimumRole === 'MANAGER' && !['ADMIN', 'MANAGER'].includes(user.role)) ||
      (minimumRole === 'ADMIN' && user.role !== 'ADMIN')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3) call handler
    const result = await handler(request, user)

    // 4) if handler already gave us a NextResponse, use it
    if (result instanceof NextResponse) {
      return result
    }

    // 5) otherwise JSON-serialize the plain object
    return NextResponse.json(result)
  }
}
