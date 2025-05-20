import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'

export const GET = withAuthentication(async (req) => {
  const minimalFetch = req.nextUrl.searchParams.get('minimal') === 'true'
  if (minimalFetch) {
    return prisma.project.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  } else {
    return prisma.project.findMany()
  }
})

export const POST = withAuthentication(async (req) => {
  const { name, description } = await req.json()
  await prisma.project.create({
    data: {
      name,
      description,
    },
  })
  return {
    success: true,
  }
})
