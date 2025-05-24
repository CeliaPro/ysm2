// app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { withAuthentication } from '@/app/utils/auth.utils';
import { addMessageToConversation } from '@/lib/actions/conversations/conversation';
import { ChatRole } from '@prisma/client';

// Helper to throw if an env var is missing
function getEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing environment variable: ${name}`);
  return val;
}

export const POST = withAuthentication(async (req: NextRequest, user) => {
  // 1️⃣ Parse + validate
  const { messages, conversationId } = await req.json();
  if (!conversationId) {
    return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
  }

  // 2️⃣ Ensure OPENAI_API_KEY at runtime
  let apiKey: string;
  try {
    apiKey = getEnv('OPENAI_API_KEY');
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // 3️⃣ Dynamically import the OpenAI provider
  const { openai } = await import('@ai-sdk/openai');
  // Set the API key in the environment variable before using the SDK
  process.env.OPENAI_API_KEY = apiKey;
  // Create a LanguageModelV1 by passing the correct model name
  const model = openai('gpt-4o');

  // 4️⃣ Stream & buffer the response
  const stream = await streamText({
    model,
    messages: messages.map(m => ({
      role: m.role.toLowerCase(),
      content: m.content,
    })),
  });

  let fullResponse = '';
  for await (const chunk of stream.textStream) {
    fullResponse += chunk;
  }

  // 5️⃣ Persist the assistant’s reply
  await addMessageToConversation({
    content: fullResponse,
    role: ChatRole.ASSISTANT,
    conversationId,
    userId: user.id,
    metadata: {
      timestamp: Date.now(),
      hasContext: false,
      environment: process.env.NODE_ENV || 'production',
    },
  });

  // 6️⃣ Return it as JSON
  return NextResponse.json({ success: true, assistant: fullResponse });
}, 'EMPLOYEE');
