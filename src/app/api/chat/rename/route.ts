// app/api/chat/rename/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renameConversation } from '@/lib/actions/conversations/conversation'
import { prisma } from '@/lib/prisma'
import { withAuthentication } from '@/app/utils/auth.utils'
import { logActivity } from '@/app/utils/logActivity'

export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const { conversationId, title } = await req.json()

    if (!conversationId || !title) {
      await logActivity({
        userId: user.id,
        action: 'RENAME_CONVERSATION',
        status: 'FAILURE',
        description: 'conversationId and/or title missing in request',
        req,
      })
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
      await logActivity({
        userId: user.id,
        action: 'RENAME_CONVERSATION',
        status: 'FAILURE',
        description: `Tried to rename conversation ${conversationId} but not found or unauthorized`,
        req,
      })
      return NextResponse.json(
        { success: false, message: 'Conversation not found or unauthorized' },
        { status: 404 }
      )
    }

    // Rename the conversation
    const updated = await renameConversation(conversationId, title)

    if (!updated) {
      await logActivity({
        userId: user.id,
        action: 'RENAME_CONVERSATION',
        status: 'FAILURE',
        description: `Failed to update conversation ${conversationId}`,
        req,
      })
      return NextResponse.json(
        { success: false, message: 'Failed to update conversation' },
        { status: 500 }
      )
    }

    await logActivity({
      userId: user.id,
      action: 'RENAME_CONVERSATION',
      status: 'SUCCESS',
      description: `Renamed conversation ${conversationId} to "${title}"`,
      req,
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation renamed successfully',
      data: updated,
    })
  } catch (error: any) {
    await logActivity({
      userId: user.id,
      action: 'RENAME_CONVERSATION',
      status: 'FAILURE',
      description: `Internal server error: ${error.message}`,
      req,
    })
    console.error('[CHAT_RENAME_ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}, 'EMPLOYEE')
