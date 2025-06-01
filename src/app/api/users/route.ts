import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { logActivity } from '@/app/utils/logActivity'

export const GET = withAuthentication(async (req, user) => {
  const minimalFetch = req.nextUrl.searchParams.get('minimal') === 'true'
  if (minimalFetch) {
    // No need to log minimal fetch unless you want to
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  } else {
    if (user.role !== 'ADMIN') {
      await logActivity({
        userId: user.id,
        action: 'LIST_USERS',
        status: 'FAILURE',
        description: 'Non-admin attempted to fetch all users',
        req,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await logActivity({
      userId: user.id,
      action: 'LIST_USERS',
      status: 'SUCCESS',
      description: 'Admin fetched all users (detailed)',
      req,
    })

    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        lastLogin: true,
      },
    })
  }
}, 'EMPLOYEE')
