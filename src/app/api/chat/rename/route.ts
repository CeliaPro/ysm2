import { NextResponse, NextRequest } from 'next/server';
import { renameConversation } from '@/lib/actions/conversations/conversation';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/getUserFromRequest'; // JWT-based helper

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const { conversationId, title } = await req.json();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found or unauthorized' },
        { status: 404 }
      );
    }

    const updated = await renameConversation(conversationId, title);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Failed to update conversation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conversation renamed successfully",
      data: updated
    });

  } catch (error) {
    console.error('[CHAT_RENAME_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
