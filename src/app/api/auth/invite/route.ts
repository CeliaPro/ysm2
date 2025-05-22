import {
  generateInviteEmailParams,
  generateInviteToken,
} from '@/app/utils/invite.utils'
import { withAuthentication } from '@/app/utils/auth.utils'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const client = new SESClient({ region: 'eu-central-1', credentials: {
  accessKeyId: process.env.AWS_ACCESS_SES_KEY_ID!!,
  secretAccessKey: process.env.AWS_SECRET_SES_ACCESS_KEY!!,
} })

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
