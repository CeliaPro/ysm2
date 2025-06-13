// app/api/chat/create/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createConversation } from '@/lib/actions/conversations/conversation';
import { withAuthentication } from '@/app/utils/auth.utils';
import { logActivity } from '@/app/utils/logActivity';

export const POST = withAuthentication(async (req: NextRequest, user) => {
  const sessionId = req.cookies?.get('sessionId')?.value;

  try {
    const body = await req.json();
    const { title } = body;

    // Validation
    if (!title || typeof title !== 'string') {
      await logActivity({
        userId: user.id,
        action: 'CREATE_CONVERSATION',
        status: 'FAILURE',
        description: 'Attempted to create conversation without valid title',
        req,
        sessionId,
      });
      return NextResponse.json(
        { success: false, message: 'Le titre est requis et doit être une chaîne de caractères.' },
        { status: 400 }
      );
    }

    // Create conversation
    const conversationData = await createConversation({
      userId: user.id,
      title,
    });

    await logActivity({
      userId: user.id,
      action: 'CREATE_CONVERSATION',
      status: 'SUCCESS',
      description: `Created conversation with title: "${title}"`,
      req,
      sessionId,
    });

    // Build response (welcome message in French)
    const responseData = {
      ...conversationData,
      welcomeMessage: 'Bienvenue dans votre nouvelle conversation !',
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    await logActivity({
      userId: user.id,
      action: 'CREATE_CONVERSATION',
      status: 'FAILURE',
      description: `Error creating conversation: ${error.message}`,
      req,
      sessionId,
    });
    console.error('Error in /api/chat/create:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}, 'EMPLOYEE');
