import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'

export const GET = withAuthentication(async (req) => {
  const minimalFetch = req.nextUrl.searchParams.get('minimal') === 'true'
  if (minimalFetch) {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  } else {
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
}, 'ADMIN')
