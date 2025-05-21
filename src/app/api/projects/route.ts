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


//le moi
export const DELETE = withAuthentication(async (req) => {
  const projectId = req.nextUrl.searchParams.get('id')

  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), { status: 400 })
  }

  await prisma.project.delete({
    where: { id: projectId },
  })

  return new Response(JSON.stringify({ success: true }))
},'MANAGER')


