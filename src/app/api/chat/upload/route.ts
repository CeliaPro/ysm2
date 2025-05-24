// app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { withAuthentication } from '@/app/utils/auth.utils';
import { addMessageToConversation } from '@/lib/actions/conversations/conversation';
import { ChatRole } from '@prisma/client';

function getEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing environment variable: ${name}`);
  return val;
}

export const POST = withAuthentication(async (req: NextRequest, user) => {
  // 1️⃣ Parse + validate
  const { messages, conversationId } = await req.json();
  if (!conversationId) {
    return NextResponse.json({ success: false, error: 'Missing conversationId' }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ success: false, error: 'No messages provided' }, { status: 400 });
  }

  // 2️⃣ Load your OpenAI key at runtime
  let apiKey: string;
  try {
    apiKey = getEnv('OPENAI_API_KEY');
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }

  // 3️⃣ Instantiate the official OpenAI client
  const openai = new OpenAI({ apiKey });

  // 4️⃣ Call Chat Completions API
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages.map(m => ({
        role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    });

    const assistantReply = completion.choices[0].message?.content ?? '';
    
    // 5️⃣ Persist the assistant’s message
    await addMessageToConversation({
      content: assistantReply,
      role: ChatRole.ASSISTANT,
      conversationId,
      userId: user.id,
      metadata: {
        timestamp: Date.now(),
        hasContext: false,
        environment: process.env.NODE_ENV!,
      },
    });

    // 6️⃣ Return the reply as JSON
    return NextResponse.json({ success: true, assistant: assistantReply });
  } catch (err) {
    console.error('OpenAI API error:', err);
    return NextResponse.json({ success: false, error: 'OpenAI request failed' }, { status: 500 });
  }
}, 'EMPLOYEE');
