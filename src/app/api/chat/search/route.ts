export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai as aiProvider } from '@ai-sdk/openai';
import { getContextFromQuery } from '@/lib/astra/search';
import { addMessageToConversation } from '@/lib/actions/conversations/conversation';
import { withAuthentication } from '@/app/utils/auth.utils';

export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    console.log('Starting chat request in environment:', process.env.NODE_ENV);

    const { messages, conversationId } = await req.json();

    console.log('Request details:', {
      userId: user.id,
      conversationId,
      messageCount: messages?.length,
      environment: process.env.NODE_ENV,
      database: process.env.MONGODB_URI?.substring(0, 20) + '...',
    });

    // Defensive: Should never happen, but guard for missing user id
    if (!user?.id || !conversationId) {
      return NextResponse.json(
        { success: false, error: "Utilisateur ou conversationId manquant" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun message fourni" },
        { status: 400 }
      );
    }

    const lastUserMsg = messages.filter((m) => m.role === 'USER').slice(-1)[0];
    const query = lastUserMsg?.content ?? '';

    // Context search
    let docContext = '';
    try {
      docContext = await getContextFromQuery(query, conversationId);
    } catch (searchError) {
      console.error('La recherche vectorielle a échoué :', searchError);
      // Continue with empty context if search fails
    }

    const systemPrompt = {
      role: 'system',
      content: `
Vous êtes un assistant IA expert en Modélisation des Informations du Bâtiment (BIM), systèmes électriques et contrats de construction. 
Votre fonction principale est de fournir des réponses précises et pertinentes en fonction des informations fournies.

**Contexte de la Requête :**
${docContext ? `\`\`\`\n${docContext}\n\`\`\`` : 'Aucun contexte spécifique disponible.'}

**Requête actuelle :**
${query}

**Instructions de réponse :**
- Enrichissez vos connaissances existantes en BIM, électricité et construction avec ce contexte.
- Si le contexte contient les informations nécessaires, utilisez-le pour répondre.
- Structurez votre réponse avec du Markdown.
- Soyez précis et professionnel.
- Citez des sources du contexte si applicable.
`,
    };

    // Save user message
    try {
      await addMessageToConversation({
        content: query,
        role: 'USER',
        conversationId,
        userId: user.id,
        metadata: {
          timestamp: Date.now(),
          environment: process.env.NODE_ENV,
        },
      });
      console.log('Successfully saved user message to database');
    } catch (saveError) {
      console.error('Failed to save user message:', {
        error: saveError,
        userId: user.id,
        conversationId,
        stack: saveError instanceof Error ? saveError.stack : undefined,
      });
      // Continue execution but log the error
    }

    const stream = await streamText({
      model: aiProvider('gpt-4o-mini'),
      messages: [
        systemPrompt,
        ...messages.map((m) => ({
          role: m.role.toLowerCase(),
          content: m.content,
        })),
      ],
    });

    const encoder = new TextEncoder();
    let fullResponse = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.textStream) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          try {
            await addMessageToConversation({
              content: fullResponse,
              role: 'ASSISTANT',
              conversationId,
              userId: user.id,
              metadata: {
                timestamp: Date.now(),
                hasContext: !!docContext,
                environment: process.env.NODE_ENV,
              },
            });
            console.log('Successfully saved assistant message to database');
          } catch (saveError) {
            console.error('Failed to save assistant message:', {
              error: saveError,
              userId: user.id,
              conversationId,
              stack:
                saveError instanceof Error ? saveError.stack : undefined,
            });
          }

          controller.close();
        } catch (err) {
          console.error('Stream error:', err);
          controller.error(err);
        }
      },
      cancel() {
        stream.textStream.cancel();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('❌ /api/chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erreur Interne du Serveur',
      },
      { status: 500 }
    );
  }
}, 'EMPLOYEE');
