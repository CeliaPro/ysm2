// app/api/chat/create/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createConversation } from '@/lib/actions/conversations/conversation';
import { getUserFromRequest } from '@/lib/getUserFromRequest'; // Your helper for JWT

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }

    const conversationData = await createConversation({ userId: user.userId, title });

    return NextResponse.json({
      success: true,
      data: conversationData
    }, { status: 201 });

  } catch (error) {
    console.error('Error in /api/chat/create:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
