// lib/ai/stream.ts
import { openai as aiProvider } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { CoreMessage } from "ai";    // ← import the exact type

/**
 * Streams a chat completion from the LLM as an event-stream Response.
 * @param messages - Array of `CoreMessage` (roles: 'system'|'user'|'assistant')
 */


export async function streamChatResponse(
  messages: CoreMessage[]         // ← annotate with CoreMessage[]
): Promise<Response> {
  const stream = await streamText({
    model: aiProvider("gpt-4o-mini"),
    messages,                      // now TS knows this array is valid
  });

  

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      stream.textStream.cancel();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
