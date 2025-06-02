import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/app/utils/logActivity'

export const POST = withAuthentication(async (req, user) => {
  // Extract sessionId from cookies (works in API routes)
  const sessionId = req.cookies?.get('sessionId')?.value

  const { id, archived } = await req.json()
  if (!id) return new Response('Missing id', { status: 400 })

  try {
    await prisma.document.update({
      where: { id },
      data: { archived: !!archived },
    })

    // Log archive/unarchive action
    await logActivity({
      userId: user.id,
      action: archived ? 'ARCHIVE_DOCUMENT' : 'UNARCHIVE_DOCUMENT',
      status: 'SUCCESS',
      description: archived
        ? `Archived document with id ${id}`
        : `Unarchived document with id ${id}`,
      req,
      sessionId,
    })

    return new Response(JSON.stringify({ success: true }))
  } catch (error: any) {
    // Log failure
    await logActivity({
      userId: user.id,
      action: archived ? 'ARCHIVE_DOCUMENT' : 'UNARCHIVE_DOCUMENT',
      status: 'FAILURE',
      description: `Failed to ${archived ? 'archive' : 'unarchive'} document with id ${id}: ${error.message}`,
      req,
      sessionId,
    })
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    )
  }
})
