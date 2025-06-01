// app/api/auth/redeem/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import {
  extractInvitePayload,
  InviteRole,
  InviteType,
} from '@/app/utils/invite.utils'
import { storeJwtInCookie } from '@/app/utils/auth.utils'
import { logActivity } from '@/app/utils/logActivity'

export async function POST(req: NextRequest) {
  try {
    const { token, password, name: nameFromForm } = await req.json()

    // 1) decode token
    let payload: {
      email: string
      name: string
      role: InviteRole
      type: InviteType
    }
    try {
      payload = extractInvitePayload(token)
    } catch (err: any) {
      await logActivity({
        action: 'REDEEM_INVITE',
        status: 'FAILURE',
        description: 'Invalid or expired invite token',
        req,
      })
      return NextResponse.json(
        { error: 'Invalid or expired invite token' },
        { status: 400 }
      )
    }

    // 2) Find the invited user
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    })
    if (!user) {
      await logActivity({
        action: 'REDEEM_INVITE',
        status: 'FAILURE',
        description: `No invite found for email ${payload.email}`,
        req,
      })
      return NextResponse.json(
        { error: 'No invite found for this email.' },
        { status: 404 }
      )
    }
    if (payload.type === 'INVITE' && user.status === 'ACTIVE') {
      await logActivity({
        userId: user.id,
        action: 'REDEEM_INVITE',
        status: 'FAILURE',
        description: `User already activated for email ${payload.email}`,
        req,
      })
      return NextResponse.json(
        { error: 'User already activated.' },
        { status: 409 }
      )
    }

    // 3) Update password, set status to ACTIVE, update lastLogin, set name
    const updated = await prisma.user.update({
      where: { email: payload.email },
      data: {
        password: await hash(password, 10),
        status: 'ACTIVE',
        lastLogin: new Date(),
        name: nameFromForm || payload.name || user.name,
      },
    })

    // Log successful invite redemption
    await logActivity({
      userId: updated.id,
      action: 'REDEEM_INVITE',
      status: 'SUCCESS',
      description: `User ${updated.email} redeemed invite and activated account`,
      req,
    })

    // 4) set auth cookie & return
    return storeJwtInCookie({
      id: updated.id,
      email: updated.email,
      role: updated.role,
    })
  } catch (error: any) {
    await logActivity({
      action: 'REDEEM_INVITE',
      status: 'FAILURE',
      description: `Internal server error: ${error.message}`,
      req,
    })
    console.error('Redeem error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
