import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'

export const GET = withAuthentication(async () => {
  return prisma.document.findMany()
})

export const POST = withAuthentication(async (req) => {
  const { name, description, url, size, type, projectId, userId } =
    await req.json()
  await prisma.document.create({
    data: {
      name: name,
      description: description,
      url: url,
      size: size,
      type: type,
      project: { connect: { id: projectId } },
      user: { connect: { id: userId } },
    },
  })
  return {
    success: true,
  }
})
