import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'

// GET: Return all documents, flattening the relations for frontend

export const GET = withAuthentication(async () => {
  return prisma.document.findMany()
})


// POST: Create new document, set uploadedBy and updatedBy to current user
export const POST = withAuthentication(async (req, user) => {
  try {
    const { name, description, url, size, type, projectId, tags = [] } = await req.json()
    if (!name || !projectId || !user?.id || !url) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400 })
    }
    await prisma.document.create({
      data: {
        name,
        description,
        url,
        size,
        type,
        archived: false,
        favorite: false,
        project: { connect: { id: projectId } },
        uploadedBy: { connect: { id: user.id } }, // Sets userId foreign key
        updatedBy: { connect: { id: user.id } },  // Sets updatedById
        tags: tags.length
          ? {
              connectOrCreate: tags.map((tag: string) => ({
                where: { name: tag },
                create: { name: tag },
              })),
            }
          : undefined,
      },
    })
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err: any) {
    console.error('DOC UPLOAD ERROR', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500 })
  }
})

// PUT: Allow only ADMIN or MANAGER to update description/project/tags/updatedBy
export const PUT = withAuthentication(async (req, user) => {
  if (!['ADMIN', 'MANAGER'].includes(user.role)) {
    return new Response('Forbidden', { status: 403 })
  }
  const { id, description, projectId, tags = [] } = await req.json()
  if (!id) return new Response('Missing id', { status: 400 })
  await prisma.document.update({
    where: { id },
    data: {
      description,
      project: projectId ? { connect: { id: projectId } } : undefined,
      tags: tags.length
        ? {
            set: [],
            connectOrCreate: tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          }
        : { set: [] },
      updatedAt: new Date(),
      updatedBy: { connect: { id: user.id } },
    },
  })
  return new Response(JSON.stringify({ success: true }))
}, 'MANAGER')

// DELETE: Remove from DB only (safe for S3)
export const DELETE = withAuthentication(async (req) => {
  const { id } = await req.json()
  await prisma.document.delete({ where: { id } })
  return new Response(JSON.stringify({ success: true }))
}, 'MANAGER')
