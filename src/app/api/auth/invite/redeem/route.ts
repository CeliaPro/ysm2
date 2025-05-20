import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import { extractEmailFromToken } from '@/app/utils/invite.utils'
import { storeJwtInCookie } from '@/app/utils/auth.utils'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    let data: { email: string; name: string }
    try {
      data = extractEmailFromToken(token)
    } catch (err: any) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
    }

    const result = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await hash(password, 10),
        role: 'EMPLOYEE',
      },
    })

    return storeJwtInCookie({
      id: result.id,
      email: data.email,
      role: 'EMPLOYEE',
    })
  } catch (error: any) {
    console.error('Redeem error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
