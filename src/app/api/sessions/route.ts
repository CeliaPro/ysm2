// app/api/sessions/route.ts
import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const GET = withAuthentication(async (req, user) => {
  // Find all sessions for the current user
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { lastUsedAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      lastUsedAt: true,
      userAgent: true,
      device: true,
      ipAddress: true,
      geoCountry: true,
      geoCity: true,
    }
  })
  // Highlight current session (from cookie)
  const currentSessionId = req.cookies?.get('sessionId')?.value

  return NextResponse.json({
    sessions,
    currentSessionId,
  })
})
