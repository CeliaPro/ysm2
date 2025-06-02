import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthentication } from '@/app/utils/auth.utils'
import { authenticator } from 'otplib'

export const POST = withAuthentication(async (req, user) => {
  const { code } = await req.json()

  // Safety: check code presence and format
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Missing or invalid 2FA code." }, { status: 400 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  if (!dbUser?.twoFaSecret) {
    return NextResponse.json({ error: "2FA not set up." }, { status: 400 })
  }

  const valid = authenticator.check(code, dbUser.twoFaSecret)
  if (!valid) {
    // Optionally, log attempt here!
    return NextResponse.json({ error: "Invalid 2FA code." }, { status: 401 })
  }

  // Enable 2FA for user (idempotent: doesn't matter if already true)
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFaEnabled: true }
  })

  // Optionally, log success here!

  return NextResponse.json({ success: true })
})
