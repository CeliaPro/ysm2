// app/api/chat/upload/route.ts
// Run this route on Node.js (Serverless) runtime to support jsonwebtoken and streaming

import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { withAuthentication } from '@/app/utils/auth.utils';
import { addMessageToConversation } from '@/lib/actions/conversations/conversation';
import { ChatRole } from '@prisma/client';

/**
 * Lazily imports the AI provider factory from @ai-sdk/openai
 */
async function getAIProviderFactory(): Promise<(model: string) => import('ai').LanguageModelV1> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  const { openai } = await import('@ai-sdk/openai');
  return openai;
}

export const POST = withAuthentication(async (req: NextRequest, user) => {
  // Initialize AI provider at request time
  let aiProvider: (model: string) => import('ai').LanguageModelV1;
  try {
    aiProvider = await getAIProviderFactory();
  } catch (err: any) {
    console.error('AI init error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // Parse request body
  const { messages, conversationId } = await req.json();
  if (!conversationId) {
    return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
  }

  // Generate AI stream
  const stream = await streamText({
    model: aiProvider('gpt-4o-mini'),
    messages: messages.map(m => ({ role: m.role.toLowerCase(), content: m.content })),
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
        // Save assistant message
        await addMessageToConversation({
          content: fullResponse,
          role: ChatRole.ASSISTANT,
          conversationId,
          userId: user.id,
          metadata: { timestamp: Date.now(), hasContext: false, environment: process.env.NODE_ENV },
        });
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
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}, 'EMPLOYEE');
