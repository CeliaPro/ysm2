import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/app/utils/logActivity'

// GET: Return all documents, flattening the relations for frontend
export const GET = withAuthentication(async () => {
  return prisma.document.findMany()
})

// POST: Create new document, set uploadedBy and updatedBy to current user
export const POST = withAuthentication(async (req, user) => {
  const sessionId = req.cookies?.get('sessionId')?.value
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
        uploadedBy: { connect: { id: user.id } },
        updatedBy: { connect: { id: user.id } },
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

    // Log successful document upload
    await logActivity({
      userId: user.id,
      action: 'UPLOAD_DOCUMENT',
      status: 'SUCCESS',
      description: `Uploaded document "${name}" to project ${projectId}`,
      req,
      sessionId,
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    // Log failure
    await logActivity({
      userId: user?.id,
      action: 'UPLOAD_DOCUMENT',
      status: 'FAILURE',
      description: `Failed to upload document: ${errorMessage}`,
      req,
      sessionId,
    })

    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500 })
  }
})

// PUT: Allow only ADMIN or MANAGER to update description/project/tags/updatedBy
export const PUT = withAuthentication(async (req, user) => {
  const sessionId = req.cookies?.get('sessionId')?.value
  if (!['ADMIN', 'MANAGER'].includes(user.role)) {
    return new Response('Forbidden', { status: 403 })
  }
  const { id, description, projectId, tags = [] } = await req.json()
  if (!id) return new Response('Missing id', { status: 400 })

  try {
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

    // Log update
    await logActivity({
      userId: user.id,
      action: 'UPDATE_DOCUMENT',
      status: 'SUCCESS',
      description: `Updated document with id ${id}`,
      req,
      sessionId,
    })

    return new Response(JSON.stringify({ success: true }))
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    // Log failure
    await logActivity({
      userId: user.id,
      action: 'UPDATE_DOCUMENT',
      status: 'FAILURE',
      description: `Failed to update document with id ${id}: ${errorMessage}`,
      req,
      sessionId,
    })

    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500 })
  }
}, 'MANAGER')

// DELETE: Remove from DB only (safe for S3)
export const DELETE = withAuthentication(async (req, user) => {
  const sessionId = req.cookies?.get('sessionId')?.value
  const { id } = await req.json()
  if (!id) return new Response('Missing id', { status: 400 })

  try {
    await prisma.document.delete({ where: { id } })

    // Log delete
    await logActivity({
      userId: user.id,
      action: 'DELETE_DOCUMENT',
      status: 'SUCCESS',
      description: `Deleted document with id ${id}`,
      req,
      sessionId,
    })

    return new Response(JSON.stringify({ success: true }))
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    // Log failure
    await logActivity({
      userId: user.id,
      action: 'DELETE_DOCUMENT',
      status: 'FAILURE',
      description: `Failed to delete document with id ${id}: ${errorMessage}`,
      req,
      sessionId,
    })

    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500 })
  }
}, 'MANAGER')
