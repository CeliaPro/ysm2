// app/api/sessions/logout/route.ts
//logs out a user from a specific session by deleting the session from the database and clearing cookies
// logs out this browser/tab only
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/app/utils/logActivity'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('sessionId')?.value
  // Try to get user ID from JWT cookie if possible
  let userId: string | undefined
  const jwtToken = req.cookies.get('jwt')?.value
  if (jwtToken) {
    try {
      const decoded: any = jwt.verify(jwtToken, process.env.JWT_SECRET as string)
      userId = decoded?.id
    } catch (e) {
      // Do nothing; invalid token
    }
  }

  if (!sessionId) {
    // Log failed logout (no session)
    await logActivity({
      userId,
      action: 'LOGOUT_SESSION',
      status: 'FAILURE',
      description: 'No session found when trying to logout',
      req,
      sessionId: undefined,
    })
    return NextResponse.json({ success: false, message: 'No session found' }, { status: 400 })
  }

  // Delete the session from DB
  await prisma.session.delete({ where: { id: sessionId } })

  // Log successful logout
  await logActivity({
    userId,
    action: 'LOGOUT_SESSION',
    status: 'SUCCESS',
    description: `Logged out session ${sessionId}`,
    req,
    sessionId,
  })

  // Clear session & JWT cookies
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
  response.cookies.set('sessionId', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })
  response.cookies.set('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })
  return response
}
