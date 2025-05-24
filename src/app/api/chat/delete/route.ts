// app/api/chat/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { deleteConversation } from '@/lib/actions/conversations/conversation'
import { withAuthentication } from '@/app/utils/auth.utils'

export const DELETE = withAuthentication(
  async (req: NextRequest, user) => {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
    }
    const conversationId = body.conversationId as string | undefined
    if (!conversationId) {
      return NextResponse.json({ success: false, message: 'conversationId is required' }, { status: 400 })
    }
    try {
      const deleted = await deleteConversation(conversationId, user.id)
      return NextResponse.json({ success: true, message: 'Deleted', data: deleted })
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Server error'
      const status = msg.includes('not found') ? 404 : 500
      return NextResponse.json({ success: false, message: msg }, { status })
    }
  },
  'EMPLOYEE'
)
