import { DataAPIClient } from "@datastax/astra-db-ts";

// Lazy-init and validate Astra DB client at request time
let cachedDb: ReturnType<DataAPIClient["db"]> | null = null;

/**
 * Returns a configured Astra Collection, initializing the client if needed.
 * Throws an error if any required environment variable is missing.
 */
function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const endpoint    = process.env.ASTRA_DB_API_ENDPOINT;
  const token       = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const keyspace    = process.env.ASTRA_DB_NAMESPACE;
  const collection  = process.env.ASTRA_DB_COLLECTION;

  if (!endpoint) {
    throw new Error("Missing ASTRA_DB_API_ENDPOINT");
  }
  if (!token) {
    throw new Error("Missing ASTRA_DB_APPLICATION_TOKEN");
  }
  if (!keyspace) {
    throw new Error("Missing ASTRA_DB_NAMESPACE");
  }
  if (!collection) {
    throw new Error("Missing ASTRA_DB_COLLECTION");
  }

  const client = new DataAPIClient(token);
  cachedDb = client.db(endpoint, { keyspace });
  return cachedDb;
}

/**
 * Ensures the target collection exists, creating it if absent.
 */
export async function ensureCollection() {
  const db = getDb();
  try {
    await db.createCollection(process.env.ASTRA_DB_COLLECTION!, {
      vector: { dimension: 1536, metric: "dot_product" },
    });
    console.log("✅ Collection ready");
  } catch (e) {
    // Ignore "already exists" errors
    if (!(e instanceof Error) || !e.message.includes("already exists")) {
      throw e;
    }
  }
}

/**
 * Retrieves the Astra collection for vector queries.
 */
export function getCollection() {
  const db = getDb();
  return db.collection(process.env.ASTRA_DB_COLLECTION!);
}
