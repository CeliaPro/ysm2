import {
  generateInviteEmailParams,
  generateInviteToken,
} from '@/app/utils/invite.utils'
import { withAuthentication } from '@/app/utils/auth.utils'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const client = new SESClient({ region: 'eu-central-1' })

export const POST = withAuthentication(async (req) => {
  const { email, name } = await req.json()
  const token = generateInviteToken(email, name)
  const command = new SendEmailCommand(
    generateInviteEmailParams(
      name,
      email,
      `http://localhost:3000/setpassword?token=${token}`
    )
  )
  await client.send(command)
  return {
    success: true,
  }
}, 'ADMIN')
