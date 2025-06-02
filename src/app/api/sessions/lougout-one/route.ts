// app/api/sessions/logout-one/route.ts
import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/app/utils/logActivity'

// POST: Log out (revoke) a specific session by sessionId (must belong to user)
export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) {
      return NextResponse.json({ success: false, message: 'Missing sessionId' }, { status: 400 })
    }

    // Make sure the session belongs to this user (prevent abuse)
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true }
    })
    if (!session || session.userId !== user.id) {
      return NextResponse.json({ success: false, message: 'Session not found or unauthorized' }, { status: 403 })
    }

    // Delete the session
    await prisma.session.delete({ where: { id: sessionId } })

    // Log activity (optional)
    await logActivity({
      userId: user.id,
      action: 'LOGOUT_SESSION',
      status: 'SUCCESS',
      description: `Logged out session ${sessionId}`,
      req,
    })

    return NextResponse.json({ success: true, message: 'Session logged out' })
  } catch (err: any) {
    await logActivity({
      userId: user.id,
      action: 'LOGOUT_SESSION',
      status: 'FAILURE',
      description: `Failed to logout session: ${err.message}`,
      req,
    })
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}, 'EMPLOYEE')
//logout just a specific session
// This route allows an authenticated user to log out of a specific session by providing the sessionId.