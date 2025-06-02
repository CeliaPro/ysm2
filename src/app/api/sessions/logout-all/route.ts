import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { logActivity } from '@/app/utils/logActivity'

export const POST = withAuthentication(async (req, user) => {
  try {
    await prisma.session.deleteMany({ where: { userId: user.id } })

    // Log successful logout-all
    await logActivity({
      userId: user.id,
      action: 'LOGOUT_ALL_SESSIONS',
      status: 'SUCCESS',
      description: 'User logged out of all sessions',
      req,
    })

    const response = NextResponse.json({ success: true, message: 'All sessions logged out' })
    response.cookies.set('sessionId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    })
    response.cookies.set('jwt', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    })
    return response
  } catch (error: any) {
    // Log failure
    await logActivity({
      userId: user.id,
      action: 'LOGOUT_ALL_SESSIONS',
      status: 'FAILURE',
      description: `Failed to logout all sessions: ${error.message}`,
      req,
    })

    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}, 'EMPLOYEE')
//logs out everywhere