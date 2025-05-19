import { NextResponse, NextRequest } from 'next/server';
import { getUserConversations } from '@/lib/actions/conversations/conversation';
import { getUserFromRequest } from '@/lib/getUserFromRequest'; // Your JWT helper

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversations = await getUserConversations(user.userId);

    if (!Array.isArray(conversations)) {
      console.error('Invalid conversations data:', conversations);
      return NextResponse.json(
        { success: false, message: 'Invalid conversations data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conversations
    });

  } catch (error) {
    console.error('[CHAT_GET_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
