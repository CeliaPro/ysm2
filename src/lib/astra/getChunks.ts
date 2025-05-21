
import { getCollection, ensureCollection } from "./client";
import type { RawChunk } from "./upload";

/**
 * Récupère tous les chunks associés à une conversation dans Astra DB.
 */
export async function getChunksByDocumentId(documentId: string): Promise<RawChunk[]> {
  if (!documentId) throw new Error("documentId requis");

  await ensureCollection();
  const collection = getCollection();

  const results = await collection
    .find({
      "metadata.documentId": documentId,
    })
    .sort({ "metadata.chunkIndex": 1 })
    .toArray();

  return results.map((doc): RawChunk => ({
    pageContent: doc.text,
    metadata: { ...doc.metadata },
  }));
}
