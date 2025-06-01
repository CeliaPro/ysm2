import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'

export const POST = withAuthentication(async (req) => {
  const { id, star } = await req.json()
  if (!id) return new Response('Missing id', { status: 400 })
  await prisma.document.update({
    where: { id },
    data: { favorite: !!star },
  })
  return new Response(JSON.stringify({ success: true }))
})
