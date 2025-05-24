// lib/astra/search.ts
import OpenAI from "openai";
import { getCollection } from "./client";

/**
 * Retrieves relevant document snippets for a query from Astra DB.
 */
export async function getContextFromQuery(
  query: string,
  conversationId: string
): Promise<string> {
  // Lazy-instantiate OpenAI client at runtime
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  try {
    // 1️⃣ Generate embedding
    const embedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      encoding_format: "float",
    });
    const vector = embedRes.data[0].embedding;

    // 2️⃣ Query AstraDB collection
    const col = getCollection();
    const results = await col
      .find(
        { "metadata.conversationId": conversationId },
        {
          sort: { $vector: vector },
          limit: 5,
        }
      )
      .toArray();

    console.log("Vector search results:", results);

    // 3️⃣ Format results
    if (!results.length) return "No relevant context found.";

    return results
      .map((doc) => {
        const md = doc.metadata;
        const idx = md.chunkIndex !== undefined ? md.chunkIndex + 1 : "N/A";
        return `From ${md.source} (Part ${idx}):\n${doc.text}`;
      })
      .join("\n\n---\n\n");
  } catch (e) {
    console.error("Vector search failed:", e);
    throw e;
  }
}
