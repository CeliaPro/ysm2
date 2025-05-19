export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { openai as aiProvider } from "@ai-sdk/openai";
import { getContextFromQuery } from "@/lib/astra/search";
import { addMessageToConversation } from "@/lib/actions/conversations/conversation";
import { getUserFromRequest } from "@/lib/getUserFromRequest"; // ✅ your JWT helper

export async function POST(req: NextRequest) {
  try {
    console.log('Starting chat request in environment:', process.env.NODE_ENV);
    const user = await getUserFromRequest(req);
    const { messages, conversationId } = await req.json();

    if (!user || !user.userId || !conversationId) {
      return NextResponse.json(
        { error: "Missing user ID or conversation ID" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    const lastUserMsg = messages.filter(m => m.role === "USER").slice(-1)[0];
    const query = lastUserMsg?.content ?? "";

    // 🔍 Search context from vector DB
    let docContext = "";
    try {
      docContext = await getContextFromQuery(query, conversationId);
    } catch (searchError) {
      console.error("Vector search failed:", searchError);
    }

    const systemPrompt = {
      role: "system",
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
- Structurez votre réponse avec du Markdown
- Soyez précis et professionnel
- Citez des sources du contexte si applicable
      `
    };

    // 💾 Save user message
    try {
      await addMessageToConversation({
        content: query,
        role: "USER",
        conversationId,
        userId: user.userId,
        metadata: {
          timestamp: Date.now(),
          environment: process.env.NODE_ENV
        }
      });
    } catch (saveError) {
      console.error('Failed to save user message:', saveError);
    }

    // 🔁 Stream AI response
    const stream = await streamText({
      model: aiProvider("gpt-4o-mini"),
      messages: [systemPrompt, ...messages.map(m => ({
        role: m.role.toLowerCase(),
        content: m.content
      }))]
    });

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.textStream) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // 💾 Save assistant message after streaming
          try {
            await addMessageToConversation({
              content: fullResponse,
              role: "ASSISTANT",
              conversationId,
              userId: user.userId,
              metadata: {
                timestamp: Date.now(),
                hasContext: !!docContext,
                environment: process.env.NODE_ENV
              }
            });
          } catch (saveError) {
            console.error('Failed to save assistant message:', saveError);
          }

          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
      cancel() {
        stream.textStream.cancel();
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      }
    });

  } catch (error) {
    console.error("❌ /api/chat/search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error"
      },
      { status: 500 }
    );
  }
}
