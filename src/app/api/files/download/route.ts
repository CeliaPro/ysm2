import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'

// GET: fetch all documents, include project, uploadedBy, updatedBy, tags
export const GET = withAuthentication(async () => {
  const docs = await prisma.document.findMany({
    include: {
      project: true,
      uploadedBy: true,   // uploader
      updatedBy: true,    // last editor (nullable)
      tags: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  // Return documents with expanded info for frontend display
  return docs.map(doc => ({
    id: doc.id,
    name: doc.name,
    description: doc.description,
    url: doc.url,
    size: doc.size,
    type: doc.type,
    archived: doc.archived,
    favorite: doc.favorite,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    projectId: doc.projectId,
    project: doc.project ? { id: doc.project.id, name: doc.project.name } : null,
    uploadedBy: doc.uploadedBy ? { id: doc.uploadedBy.id, fullName: doc.uploadedBy.name } : null,
    updatedBy: doc.updatedBy ? { id: doc.updatedBy.id, fullName: doc.updatedBy.name } : null,
    tags: doc.tags.map(t => ({ id: t.id, name: t.name })),
  }))
})

// POST: create new document, link tags, set uploadedBy and updatedBy to current user
export const POST = withAuthentication(async (req, user) => {
  const { name, description, url, size, type, projectId, tags = [] } = await req.json()
  // Basic validation
  if (!name || !url || !size || !type || !projectId || !user?.id) {
    return new Response(
      JSON.stringify({ success: false, message: 'Missing required fields' }),
      { status: 400 }
    )
  }
  const created = await prisma.document.create({
    data: {
      name,
      description,
      url,
      size,
      type,
      archived: false,
      favorite: false,
      project: { connect: { id: projectId } },
      uploadedBy: { connect: { id: user.id } },
      updatedBy: { connect: { id: user.id } },
      tags: tags.length
        ? {
            connectOrCreate: tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag },
            }))
          }
        : undefined
    },
  })
  return { success: true, document: created }
})

// PUT: edit doc (admin/project manager only), update desc/project/tags/updatedBy
export const PUT = withAuthentication(async (req, user) => {
  // Only allow admins/project managers
  if (!['ADMIN', 'MANAGER'].includes(user.role)) {
    return new Response('Forbidden', { status: 403 })
  }
  const { id, description, projectId, tags = [] } = await req.json()
  if (!id) {
    return new Response('Missing document id', { status: 400 })
  }
  const updated = await prisma.document.update({
    where: { id },
    data: {
      description,
      project: projectId ? { connect: { id: projectId } } : undefined,
      tags: tags.length
        ? {
            set: [], // remove old tags
            connectOrCreate: tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag },
            }))
          }
        : undefined,
      updatedAt: new Date(),
      updatedBy: { connect: { id: user.id } }, // set the last editor
    }
  })
  return { success: true, document: updated }
}, 'MANAGER') // minimum role required

// DELETE: just delete the document entry in the DB (not S3)
export const DELETE = withAuthentication(async (req) => {
  const { id } = await req.json()
  await prisma.document.delete({ where: { id } })
  return new Response(JSON.stringify({ success: true }))
}, 'MANAGER')
