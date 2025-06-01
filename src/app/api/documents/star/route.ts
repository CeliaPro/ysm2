import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/app/utils/logActivity'

export const POST = withAuthentication(async (req, user) => {
  const { id, star } = await req.json()
  if (!id) return new Response('Missing id', { status: 400 })

  try {
    await prisma.document.update({
      where: { id },
      data: { favorite: !!star },
    })

    // Log favorite/unfavorite action
    await logActivity({
      userId: user.id,
      action: star ? 'FAVORITE_DOCUMENT' : 'UNFAVORITE_DOCUMENT',
      status: 'SUCCESS',
      description: star
        ? `Starred document with id ${id}`
        : `Unstarred document with id ${id}`,
      req,
    })

    return new Response(JSON.stringify({ success: true }))
  } catch (error: any) {
    // Log failure
    await logActivity({
      userId: user.id,
      action: star ? 'FAVORITE_DOCUMENT' : 'UNFAVORITE_DOCUMENT',
      status: 'FAILURE',
      description: `Failed to ${star ? 'star' : 'unstar'} document with id ${id}: ${error.message}`,
      req,
    })
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    )
  }
})
