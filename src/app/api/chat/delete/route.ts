// app/api/chat/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { deleteConversation } from '@/lib/actions/conversations/conversation';
import { withAuthentication } from '@/app/utils/auth.utils';
import { logActivity } from '@/app/utils/logActivity';

// POST /api/chat/delete (expects JSON { conversationId: string })
export const POST = withAuthentication(
  async (req: NextRequest, user) => {
    const sessionId = req.cookies?.get('sessionId')?.value;

    let body: any;
    try {
      body = await req.json();
    } catch {
      await logActivity({
        userId: user.id,
        action: 'DELETE_CONVERSATION',
        status: 'FAILURE',
        description: 'Corps JSON invalide lors de la suppression de la conversation',
        req,
        sessionId,
      });
      return NextResponse.json(
        { success: false, message: 'Corps JSON invalide.' },
        { status: 400 }
      );
    }

    const conversationId = body.conversationId as string | undefined;
    if (!conversationId) {
      await logActivity({
        userId: user.id,
        action: 'DELETE_CONVERSATION',
        status: 'FAILURE',
        description: 'conversationId manquant dans la requête',
        req,
        sessionId,
      });
      return NextResponse.json(
        { success: false, message: 'Identifiant de la conversation requis.' },
        { status: 400 }
      );
    }

    try {
      // Try to delete the conversation (must be owned by user.id)
      const deleted = await deleteConversation(conversationId, user.id);

      await logActivity({
        userId: user.id,
        action: 'DELETE_CONVERSATION',
        status: 'SUCCESS',
        description: `Conversation supprimée (id: ${conversationId})`,
        req,
        sessionId,
      });

      return NextResponse.json({
        success: true,
        message: 'Conversation supprimée avec succès.',
        data: deleted,
      });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Erreur interne du serveur.';
      const status = msg.includes('not found') || msg.includes('non trouvée') ? 404 : 500;
      await logActivity({
        userId: user.id,
        action: 'DELETE_CONVERSATION',
        status: 'FAILURE',
        description: `Échec de la suppression (${conversationId}): ${msg}`,
        req,
        sessionId,
      });
      return NextResponse.json({ success: false, message: msg }, { status });
    }
  },
  'EMPLOYEE' // Or the appropriate role for access control
);
