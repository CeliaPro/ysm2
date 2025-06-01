// app/api/chat/create/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { createConversation } from '@/lib/actions/conversations/conversation'
import { withAuthentication } from '@/app/utils/auth.utils'
import { logActivity } from '@/app/utils/logActivity'

export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { title } = body

    // Basic validation
    if (!title || typeof title !== 'string') {
      await logActivity({
        userId: user.id,
        action: 'CREATE_CONVERSATION',
        status: 'FAILURE',
        description: 'Attempted to create conversation without valid title',
        req,
      })
      return NextResponse.json(
        { success: false, message: 'Title is required and must be a string' },
        { status: 400 }
      )
    }

    // Create the conversation with the authenticated user ID
    const conversationData = await createConversation({
      userId: user.id,
      title,
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE_CONVERSATION',
      status: 'SUCCESS',
      description: `Created conversation with title: "${title}"`,
      req,
    })

    return NextResponse.json(
      {
        success: true,
        data: conversationData,
      },
      { status: 201 }
    )
  } catch (error: any) {
    await logActivity({
      userId: user.id,
      action: 'CREATE_CONVERSATION',
      status: 'FAILURE',
      description: `Error creating conversation: ${error.message}`,
      req,
    })
    console.error('Error in /api/chat/create:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}, 'EMPLOYEE')
