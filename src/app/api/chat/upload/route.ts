// app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { withAuthentication } from "@/app/utils/auth.utils";
import { addMessageToConversation } from "@/lib/actions/conversations/conversation";
import { ChatRole } from "@prisma/client";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export const POST = withAuthentication(
  async (req: NextRequest, user) => {
    // 1️⃣ Parse + validate
    const { conversationId, messages } = (await req.json()) as {
      conversationId?: string;
      messages?: { role: string; content: string }[];
    };
    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "Missing conversationId" },
        { status: 400 }
      );
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No messages provided" },
        { status: 400 }
      );
    }

    // 2️⃣ Save the user’s message
    const last = messages[messages.length - 1];
    await addMessageToConversation({
      content: last.content,
      role: ChatRole.USER,
      conversationId,
      userId: user.id,
      metadata: { timestamp: Date.now(), environment: process.env.NODE_ENV! },
    });

    // 3️⃣ Instantiate OpenAI at runtime
    let apiKey: string;
    try {
      apiKey = getEnv("OPENAI_API_KEY");
    } catch (err: any) {
      console.error(err);
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }
    const openai = new OpenAI({ apiKey });

    // 4️⃣ Call chat completions
    let assistantReply: string;
    try {
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages.map((m) => ({
          role: m.role.toLowerCase() as "user" | "assistant" | "system",
          content: m.content,
        })),
      });
      assistantReply = resp.choices?.[0].message?.content?.trim() ?? "";
    } catch (err) {
      console.error("OpenAI error:", err);
      return NextResponse.json(
        { success: false, error: "OpenAI request failed" },
        { status: 500 }
      );
    }

    // 5️⃣ Save the assistant’s reply
    await addMessageToConversation({
      content: assistantReply,
      role: ChatRole.ASSISTANT,
      conversationId,
      userId: user.id,
      metadata: { timestamp: Date.now(), environment: process.env.NODE_ENV! },
    });

    // 6️⃣ Return JSON
    return NextResponse.json({ success: true, assistant: assistantReply });
  },
  "EMPLOYEE"
);
