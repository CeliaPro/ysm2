import fs from "fs/promises";
import { getCollection, ensureCollection } from "./client";
import { loadAndSplitPDF } from "./loader";
import { generateEmbedding } from "./embedding";

export interface DocumentMetadata {
  // Required fields from file upload
  originalName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string | null;
  conversationId: string | null;
  processingId: string;
}
interface UploadPDFFileParams {
  filePath: string;
  fileName: string;
  userId?: string;
  conversationId?: string;
  metadata?: DocumentMetadata;
}

export async function uploadPDFFile({
  filePath,
  fileName,
  userId,
  conversationId,
  metadata
}: UploadPDFFileParams) {
  try {
    await ensureCollection();
    const collection = getCollection();

    const docs = await loadAndSplitPDF(filePath);
    const uploadedChunks = [];

    for (let i = 0; i < docs.length; i++) {
      const { pageContent: text } = docs[i];
      const vector = await generateEmbedding(text);

      const documentMetadata = {
        ...metadata,
        source: fileName,
        chunkIndex: i,
        userId,
        conversationId,
        createdAt: new Date().toISOString(),
        totalChunks: docs.length
      };

      await collection.insertOne({
        $vector: vector,
        text,
        metadata: documentMetadata,
      });

      uploadedChunks.push({
        chunkIndex: i,
        text: text.substring(0, 100) + '...' // First 100 chars for logging
      });
    }

    console.log(`✔️ ${fileName} uploaded and embedded (${docs.length} chunks)`);
    console.log('Metadata:', metadata);
    
    return {
      success: true,
      chunks: docs.length,
      metadata: metadata
    };

  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error);
    throw error;
  } finally {
    try {
      await fs.unlink(filePath); // cleanup
    } catch (e) {
      console.error('Failed to cleanup file:', e);
    }
  }
}