
// app/api/chat/create/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { createConversation } from '@/lib/actions/conversations/conversation'
import { withAuthentication } from '@/app/utils/auth.utils' // adjust path accordingly

export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { title } = body

    // Basic validation
    if (!title || typeof title !== 'string') {
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

    return NextResponse.json(
      {
        success: true,
        data: conversationData,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in /api/chat/create:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}, 'EMPLOYEE') // required minimum role to access this route (adjust as needed)
