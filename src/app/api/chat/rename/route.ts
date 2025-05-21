// app/api/chat/rename/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renameConversation } from '@/lib/actions/conversations/conversation'
import { prisma } from '@/lib/prisma'
import { withAuthentication } from '@/app/utils/auth.utils' // adjust the path if necessary

export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const { conversationId, title } = await req.json()

    if (!conversationId || !title) {
      return NextResponse.json(
        { success: false, message: 'conversationId and title are required' },
        { status: 400 }
      )
    }

    // Check conversation ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation || conversation.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found or unauthorized' },
        { status: 404 }
      )
    }

    // Rename the conversation
    const updated = await renameConversation(conversationId, title)

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Failed to update conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation renamed successfully',
      data: updated,
    })
  } catch (error) {
    console.error('[CHAT_RENAME_ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}, 'EMPLOYEE') // Adjust role requirement if needed
