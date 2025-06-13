// app/api/chat/rename/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { renameConversation } from '@/lib/actions/conversations/conversation';
import { prisma } from '@/lib/prisma';
import { withAuthentication } from '@/app/utils/auth.utils';
import { logActivity } from '@/app/utils/logActivity';

export const POST = withAuthentication(async (req: NextRequest, user) => {
  const sessionId = req.cookies?.get('sessionId')?.value;

  try {
    const { conversationId, title } = await req.json();

    if (!conversationId || !title) {
      await logActivity({
        userId: user.id,
        action: 'RENAME_CONVERSATION',
        status: 'FAILURE',
        description: 'conversationId et/ou titre manquant dans la requête',
        req,
        sessionId,
      });
      return NextResponse.json(
        { success: false, message: 'L\'identifiant et le titre de la conversation sont requis.' },
        { status: 400 }
      );
    }

    // Vérifier l'appartenance de la conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== user.id) {
      await logActivity({
        userId: user.id,
        action: 'RENAME_CONVERSATION',
        status: 'FAILURE',
        description: `Tentative de renommage conversation ${conversationId} non trouvée ou non autorisée`,
        req,
        sessionId,
      });
      return NextResponse.json(
        { success: false, message: 'Conversation non trouvée ou non autorisée.' },
        { status: 404 }
      );
    }

    // Renommer la conversation
    const updated = await renameConversation(conversationId, title);

    if (!updated) {
      await logActivity({
        userId: user.id,
        action: 'RENAME_CONVERSATION',
        status: 'FAILURE',
        description: `Échec de la mise à jour de la conversation ${conversationId}`,
        req,
        sessionId,
      });
      return NextResponse.json(
        { success: false, message: 'Échec de la mise à jour de la conversation.' },
        { status: 500 }
      );
    }

    await logActivity({
      userId: user.id,
      action: 'RENAME_CONVERSATION',
      status: 'SUCCESS',
      description: `Conversation ${conversationId} renommée en "${title}"`,
      req,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Conversation renommée avec succès.',
      data: updated,
    });
  } catch (error: any) {
    await logActivity({
      userId: user.id,
      action: 'RENAME_CONVERSATION',
      status: 'FAILURE',
      description: `Erreur interne du serveur : ${error.message}`,
      req,
      sessionId,
    });
    console.error('[CHAT_RENAME_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}, 'EMPLOYEE');
