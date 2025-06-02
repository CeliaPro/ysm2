// /app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/app/utils/logActivity'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  let userId: string | undefined = undefined

  // Get JWT cookie from the request
  const jwtToken = req.cookies.get('jwt')?.value
  if (jwtToken) {
    try {
      const decoded: any = jwt.verify(jwtToken, process.env.JWT_SECRET as string)
      userId = decoded?.id
    } catch (e) {
      // Invalid or expired JWT, treat as anonymous logout
    }
  }

  // Get sessionId from cookie
  const sessionId = req.cookies.get('sessionId')?.value

  // Log the logout event (include sessionId)
  await logActivity({
    userId,
    action: 'LOGOUT',
    status: 'SUCCESS',
    description: 'User logged out',
    req,
    sessionId,
  })

  // Delete session from DB (if exists)
  if (sessionId) {
    try {
      await prisma.session.delete({ where: { id: sessionId } })
    } catch (e) {
      // Ignore if not found (already expired, etc.)
    }
  }

  // Clear cookies
  const response = NextResponse.json({ message: 'Déconnexion réussie' })
  response.cookies.set('jwt', '', {
    httpOnly: true,
    secure: true,
    path: '/',
    expires: new Date(0),
  })
  response.cookies.set('sessionId', '', {
    httpOnly: true,
    secure: true,
    path: '/',
    expires: new Date(0),
  })

  return response
}
