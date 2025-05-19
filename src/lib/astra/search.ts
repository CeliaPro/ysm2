import OpenAI from "openai";
import { db } from "./client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function getContextFromQuery(query: string, conversationId: string): Promise<string> {
    try {
      // 1️⃣ Generate embedding
      const embedRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
        encoding_format: "float",
      });
      
      const vector = embedRes.data[0].embedding;
  
      // 2️⃣ Query AstraDB with correct vector search syntax
      const col = db.collection(process.env.ASTRA_DB_COLLECTION!);
      const results = await col
        .find(
          { "metadata.conversationId": conversationId },
          { 
            sort: {
              $vector: vector
            },
            limit: 5
          }
        )
        .toArray();

      // 3️⃣ Format results
      if (!results.length) {
        console.log('No relevant documents found for conversation:', conversationId);
        return "No relevant context found.";
      }

      return results
        .map((doc) => {
          const metadata = doc.metadata as { source?: string; chunkIndex?: number };
          return `From ${metadata.source} (Part ${metadata.chunkIndex + 1}):\n${doc.text}`;
        })
        .join("\n\n---\n\n");

    } catch (e) {
      console.error("Vector search failed:", e);
      throw e;
    }
}