import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthentication } from '@/app/utils/auth.utils' // Ensure user is authenticated
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export const POST = withAuthentication(async (req, user) => {
  // 1. Generate TOTP secret using otplib
  const secret = authenticator.generateSecret()

  // 2. Save to user record (but NOT yet enabled)
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFaSecret: secret }
  })

  // 3. Build otpauth URL for Google Authenticator
  const appName = 'YSM_Project' // ← Use your actual app name
  const otpauth = authenticator.keyuri(
    user.email,
    appName,
    secret
  )

  // 4. Generate QR code for the otpauth URL
  const qr = await QRCode.toDataURL(otpauth)

  return NextResponse.json({ qr, secret })
})
