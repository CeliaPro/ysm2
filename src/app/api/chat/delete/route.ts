import { NextResponse, NextRequest } from 'next/server';
import { deleteConversation } from '@/lib/actions/conversations/conversation';
import { getUserFromRequest } from '@/lib/getUserFromRequest'; // Your custom JWT auth helper

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { conversationId } = await req.json();

  if (!conversationId || typeof conversationId !== 'string') {
    return NextResponse.json(
      { success: false, message: 'conversationId is required' },
      { status: 400 }
    );
  }

  try {
    const deletedConversation = await deleteConversation(conversationId, user.userId);

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
      data: deletedConversation
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message === 'Conversation not found or unauthorized' ? 404 : 500;
    console.error("❌ Error in /api/chat/delete:", error);
    return NextResponse.json(
      { success: false, message },
      { status }
    );
  }
}
