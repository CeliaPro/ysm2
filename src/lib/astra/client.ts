import { DataAPIClient } from "@datastax/astra-db-ts";

// Validation des variables d'environnement
const envVars = [
  'ASTRA_DB_NAMESPACE', 
  'ASTRA_DB_COLLECTION',
  'ASTRA_DB_API_ENDPOINT',
  'ASTRA_DB_APPLICATION_TOKEN'
] as const;

envVars.forEach(varName => {
  if (!process.env[varName]) throw new Error(`Missing ${varName}`);
});

export const astraClient = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
export const db = astraClient.db(process.env.ASTRA_DB_API_ENDPOINT!, {
  namespace: process.env.ASTRA_DB_NAMESPACE!
});

export type AstraDoc = {
  $vector: number[];
  text: string;
  metadata: {
    source: string;
    chunkIndex: number;
    userId?: string;
    conversationId?: string;
    createdAt: string;
  };
};

export async function ensureCollection() {
  try {
    await db.createCollection(process.env.ASTRA_DB_COLLECTION!, {
      vector: { 
        dimension: 1536, 
        metric: "dot_product" 
      },
    });
    console.log("✅ Collection ready");
  } catch (e) {
    if (!e.message.includes("already exists")) throw e;
  }
}

export function getCollection() {
  return db.collection<AstraDoc>(process.env.ASTRA_DB_COLLECTION!);
}