import { NextRequest, NextResponse } from 'next/server'
import {
  generateInviteEmailParams,
  generateInviteToken,
  InviteRole,
  InviteType,
} from '@/app/utils/invite.utils'
import { withAuthentication } from '@/app/utils/auth.utils'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/app/utils/logActivity'

const client = new SESClient({
  region: 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_SES_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_SES_ACCESS_KEY!,
  },
})

export const POST = withAuthentication(async (req: NextRequest, user) => {
  // Always extract sessionId once at the top
  const sessionId = req.cookies?.get('sessionId')?.value

  try {
    // 1) Read from body
    const { email, name, role, projectIds, type } = (await req.json()) as {
      email: string
      name: string
      role: InviteRole
      type: InviteType
      projectIds?: string[]
    }

    // 2) Validate role
    if (role !== 'EMPLOYEE' && role !== 'MANAGER') {
      await logActivity({
        userId: user.id,
        action: 'INVITE_USER',
        status: 'FAILURE',
        description: `Invalid role "${role}" used for invite`,
        req,
        sessionId,
      })
      return NextResponse.json(
        { error: 'Invalid role – must be EMPLOYEE or MANAGER' },
        { status: 400 }
      )
    }

    // 3) Check if user already exists (by email)
    if (
      type === 'INVITE' &&
      (await prisma.user.findUnique({ where: { email } }))
    ) {
      await logActivity({
        userId: user.id,
        action: 'INVITE_USER',
        status: 'FAILURE',
        description: `Tried to invite existing user (${email})`,
        req,
        sessionId,
      })
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // 4) Generate token
    const token = generateInviteToken(email, name, role, type)

    // 5) Build invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ysm2.vercel.app/setpassword'
    const inviteLink = `${baseUrl}/setpassword?token=${token}`

    // 6) Fetch project names for the invite email
    let projectNamesArray: string[] = []
    if (projectIds && projectIds.length > 0) {
      const projects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { name: true },
      })
      projectNamesArray = projects.map((p) => p.name)
    }

    // 7) Compose logo url
    const logoUrl = `${baseUrl}/lovable-uploads/vinci%20energies%20logo.png`

    // 8) Send email
    const params = generateInviteEmailParams(
      name,
      email,
      inviteLink,
      type,
      projectNamesArray,
      logoUrl
    )
    await client.send(new SendEmailCommand(params))

    // 9) Create user as "invited", assign projects via projects join table
    if (type === 'INVITE') {
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          role,
          status: 'INVITED',
          password: '', // Placeholder password for invited users
          ...(projectIds && projectIds.length
            ? {
                projects: {
                  create: projectIds.map((projectId) => ({
                    project: { connect: { id: projectId } },
                    role: role as any, // Cast to ProjectRole or use the correct enum/type
                  })),
                },
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      })

      // LOG SUCCESSFUL INVITE (with sessionId)
      await logActivity({
        userId: user.id,
        action: 'INVITE_USER',
        status: 'SUCCESS',
        description: `Invited ${email} (${role})${projectIds && projectIds.length ? ` to projects: ${projectIds.join(', ')}` : ''}`,
        req,
        sessionId,
      })

      return NextResponse.json(newUser)
    } else {
      await logActivity({
        userId: user.id,
        action: 'INVITE_USER',
        status: 'SUCCESS',
        description: `Sent invite link to ${email} (${role})`,
        req,
        sessionId,
      })
      return NextResponse.json({ success: true })
    }
  } catch (err: any) {
    await logActivity({
      userId: user?.id,
      action: 'INVITE_USER',
      status: 'FAILURE',
      description: `Invite failed: ${err.message}`,
      req,
      sessionId,
    })
    console.error('[INVITE_POST_ERROR]', err)
    return NextResponse.json(
      { error: err.message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
}, 'ADMIN')
