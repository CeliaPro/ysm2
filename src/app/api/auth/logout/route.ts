// /app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/app/utils/logActivity'
import { prisma } from '@/lib/prisma' // only if you need it elsewhere

// You can use jwt.verify inline, or better: add this helper if not already exported
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  let userId: string | undefined = undefined

  // Get the JWT cookie from the request
  const jwtToken = req.cookies.get('jwt')?.value
  if (jwtToken) {
    try {
      // Use the same JWT_SECRET as in your auth.utils.ts
      const decoded: any = jwt.verify(jwtToken, process.env.JWT_SECRET as string)
      userId = decoded?.id
    } catch (e) {
      // Invalid or expired JWT, treat as anonymous logout
    }
  }

  // Log the logout (if userId is available)
  await logActivity({
    userId,
    action: 'LOGOUT',
    status: 'SUCCESS',
    description: 'User logged out',
    req,
  })

  // Clear the "jwt" cookie by setting it to empty and expired
  const response = NextResponse.json({ message: 'Déconnexion réussie' })
  response.cookies.set('jwt', '', {
    httpOnly: true,
    secure: true,
    path: '/',
    expires: new Date(0), // expires in the past
  })

  return response
}
