// app/api/chat/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { deleteConversation } from '@/lib/actions/conversations/conversation'
import { withAuthentication } from '@/app/utils/auth.utils' // Make sure the path is correct

export const POST = withAuthentication(async (req: NextRequest, user) => {
  const { conversationId } = await req.json()

  if (!conversationId) {
    return NextResponse.json(
      { success: false, message: 'conversationId is required' },
      { status: 400 }
    )
  }

  try {
    const deletedConversation = await deleteConversation(conversationId, user.id)

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
      data: deletedConversation,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error'
    const status = message === 'Conversation not found or unauthorized' ? 404 : 500

    console.error('❌ Error in /api/chat/delete:', error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}, 'EMPLOYEE') // You can change to 'MANAGER' or 'ADMIN' if needed
