// app/api/invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  generateInviteEmailParams,
  generateInviteToken,
  InviteRole,
} from '@/app/utils/invite.utils'
import { withAuthentication } from '@/app/utils/auth.utils'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const client = new SESClient({
  region: 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_SES_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_SES_ACCESS_KEY!,
  },
})

export const POST = withAuthentication(
  async (req: NextRequest, user) => {
    // 1) read role from body
    const { email, name, role } = await req.json() as {
      email: string
      name: string
      role: InviteRole
    }

    // 2) validate it’s one of the two allowed roles
    if (role !== 'EMPLOYEE' && role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Invalid role – must be EMPLOYEE or MANAGER' },
        { status: 400 }
      )
    }

    // 3) generate a token that now embeds that role
    const token = generateInviteToken(email, name, role)

    // 4) build your invite link (use an env var instead of hard-coded localhost)
    const inviteLink = `${
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }/setpassword?token=${token}`

    // 5) send the SES email
    const params = generateInviteEmailParams(name, email, inviteLink)
    await client.send(new SendEmailCommand(params))

    // 6) signal success
    return NextResponse.json({ success: true })
  },
  'ADMIN'  // only admins can hit this endpoint
)
