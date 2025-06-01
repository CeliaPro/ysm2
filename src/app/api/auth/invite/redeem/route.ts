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
      return NextResponse.json(
        { error: 'No invite found for this email.' },
        { status: 404 }
      )
    }
    if (payload.type === 'INVITE' && user.status === 'ACTIVE') {
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
        name: nameFromForm || payload.name || user.name, // <-- add this line
        // Do NOT change role here; it stays as set during invite!
      },
    })

    // 4) set auth cookie & return
    return storeJwtInCookie({
      id: updated.id,
      email: updated.email,
      role: updated.role,
    })
  } catch (error: any) {
    console.error('Redeem error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
