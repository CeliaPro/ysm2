import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'


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
      archived: false, // or set to your default value
      favorite: false, // or set to your default value
      project: { connect: { id: projectId } },
      user: { connect: { id: userId } },
    },
  })
  return {
    success: true,
  }
})

//le moi
export const DELETE = withAuthentication(async (req) => {
  const { id } = await req.json()

  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) return new Response('Not found', { status: 404 })

  const filePath = path.join(process.cwd(), 'public', doc.url)
  fs.unlinkSync(filePath)

  await prisma.document.delete({ where: { id } })

  return new Response(JSON.stringify({ success: true }))
},'MANAGER',)
