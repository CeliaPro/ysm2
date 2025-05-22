import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const GET = withAuthentication(async (req, user) => {
  const minimalFetch = req.nextUrl.searchParams.get('minimal') === 'true'
  if (minimalFetch) {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  } else {
    if(user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }
}, 'EMPLOYEE')
