// app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { withAuthentication } from "@/app/utils/auth.utils";
import { addMessageToConversation } from "@/lib/actions/conversations/conversation";
import { ChatRole } from "@prisma/client";

export const POST = withAuthentication(async (req: NextRequest, user) => {
  // 1. parse & validate
  const { messages, conversationId } = await req.json();
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  // 2. init AI provider at runtime (as you already did)
  const { openai } = await import("@ai-sdk/openai");
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }
  const aiProvider = openai(apiKey);

  // 3. generate the stream
  const stream = await streamText({
    model: aiProvider("gpt-4o-mini"),
    messages: messages.map(m => ({ role: m.role.toLowerCase(), content: m.content })),
  });

  // 4. buffer everything
  let fullResponse = "";
  for await (const chunk of stream.textStream) {
    fullResponse += chunk;
  }

  // 5. save assistant message
  await addMessageToConversation({
    content: fullResponse,
    role: ChatRole.ASSISTANT,
    conversationId,
    userId: user.id,
    metadata: {
      timestamp: Date.now(),
      hasContext: false,
      environment: process.env.NODE_ENV!,
    },
  });

  // 6. return JSON
  return NextResponse.json({ success: true, assistant: fullResponse });
}, "EMPLOYEE");
