// lib/astra/embedding.ts
import OpenAI from "openai";

const { OPENAI_API_KEY } = process.env;
if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float"
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Embedding generation failed:', error)
    throw new Error('Failed to generate embedding')
  }
}