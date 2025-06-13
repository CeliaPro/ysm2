// app/api/chat/get/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserConversations } from '@/lib/actions/conversations/conversation';
import { withAuthentication } from '@/app/utils/auth.utils'; // Adjust the path if needed

export const GET = withAuthentication(
  async (req: NextRequest, user) => {
    try {
      const data = await getUserConversations(user.id);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      console.error('[CHAT_GET_ERROR]', err);
      return NextResponse.json(
        {
          success: false,
          message: err.message
            ? `Erreur lors de la récupération des conversations : ${err.message}`
            : 'Erreur interne du serveur',
        },
        { status: 500 }
      );
    }
  },
  'EMPLOYEE' // Adjust minimum role if needed
);
