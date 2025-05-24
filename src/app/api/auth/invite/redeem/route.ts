// app/api/auth/redeem/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import { extractInvitePayload, InviteRole } from '@/app/utils/invite.utils'
import { storeJwtInCookie } from '@/app/utils/auth.utils'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    // 1) decode token
    let payload: { email: string; name: string; role: InviteRole }
    try {
      payload = extractInvitePayload(token)
    } catch (err: any) {
      return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 400 })
    }

    // 2) enforce unique email at runtime
    const existing = await prisma.user.findUnique({ where: { email: payload.email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // 3) create with dynamic role
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: await hash(password, 10),
        role: payload.role,      // ← EMPLOYEE or MANAGER
      },
    })

    // 4) set auth cookie & return
    return storeJwtInCookie({
      id: user.id,
      email: user.email,
      role: user.role,
    })

  } catch (error: any) {
    console.error('Redeem error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
