// app/api/chat/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { deleteConversation } from '@/lib/actions/conversations/conversation'
import { withAuthentication } from '@/app/utils/auth.utils'
import { logActivity } from '@/app/utils/logActivity'

export const DELETE = withAuthentication(
  async (req: NextRequest, user) => {
    let body: any
    try {
      body = await req.json()
    } catch {
      await logActivity({
        userId: user.id,
        action: 'DELETE_CONVERSATION',
        status: 'FAILURE',
        description: 'Invalid JSON body when deleting conversation',
        req,
      })
      return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
    }
    const conversationId = body.conversationId as string | undefined
    if (!conversationId) {
      await logActivity({
        userId: user.id,
        action: 'DELETE_CONVERSATION',
        status: 'FAILURE',
        description: 'Missing conversationId in request',
        req,
      })
      return NextResponse.json({ success: false, message: 'conversationId is required' }, { status: 400 })
    }
    try {
      const deleted = await deleteConversation(conversationId, user.id)
      await logActivity({
        userId: user.id,
        action: 'DELETE_CONVERSATION',
        status: 'SUCCESS',
        description: `Deleted conversation with id: ${conversationId}`,
        req,
      })
      return NextResponse.json({ success: true, message: 'Deleted', data: deleted })
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Server error'
      const status = msg.includes('not found') ? 404 : 500
      await logActivity({
        userId: user.id,
        action: 'DELETE_CONVERSATION',
        status: 'FAILURE',
        description: `Failed to delete conversation (${conversationId}): ${msg}`,
        req,
      })
      return NextResponse.json({ success: false, message: msg }, { status })
    }
  },
  'EMPLOYEE'
)
