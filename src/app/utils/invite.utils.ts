// app/utils/invite.utils.ts
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'

// only these two roles can be embedded in an invite
export type InviteRole = 'EMPLOYEE' | 'MANAGER'

const JWT_SECRET = process.env.JWT_INVITE_SECRET as string

export function generateInviteToken(
  email: string,
  name: string,
  role: InviteRole
) {
  return jwt.sign(
    { name, email, role },
    JWT_SECRET,
    { expiresIn: '1d' }
  )
}

export function extractInvitePayload(token: string) {
  const obj = jwt.verify(token, JWT_SECRET) as {
    name: string
    email: string
    role: InviteRole
  }
  // runtime guard (optional but extra-safe)
  if (obj.role !== 'EMPLOYEE' && obj.role !== 'MANAGER') {
    throw new Error(`Invalid invite role: ${obj.role}`)
  }
  return {
    name: obj.name,
    email: obj.email,
    role: obj.role,
  }
}

export function generateInviteEmailParams(
  name: string,
  email: string,
  inviteLink: string
) {
  return {
    Source: '"YSM Inc." <noreply@nerlana.com>',
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: 'Invite to YSM' },
      Body: {
        Html: {
          Data: `…your existing HTML…`,
        },
      },
    },
  }
}
