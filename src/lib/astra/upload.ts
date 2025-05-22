import { getCollection, ensureCollection } from "./client";
import { loadAndSplitPDFWithContext } from "./loader";
import { loadAndSplitExcel } from "./loaderExcel";
import { generateEmbeddingsBatch } from "./embedding";
import { addMessageToConversation } from "../actions/conversations/conversation";
import { ChatRole } from "@prisma/client";
import { sha256 } from "@/lib/utils/hash";

// Types précis pour une meilleure sécurité
export interface SourceEntry {
  documentId: string;
  fileName: string;
  addedAt: string;
  pageNumber: number | null;
}

// Define explicitly what your AstraDB client expects for metadata
// interface AstraDBMetadata {
//   source: string;
//   chunkIndex: number;
//   userId?: string | null;
//   conversationId?: string | null;
//   chunkHash: string;
//   createdAt: string;
//   // Additional fields
//   originalName?: string;
//   fileSize?: number;
//   fileType?: string;
//   uploadedAt?: string;
//   uploadedBy?: string | null;
//   processingId?: string;
//   totalChunks?: number;
//   pageNumber?: number | null;
//   sources?: SourceEntry[];
// }

// Your complete document metadata type
export interface DocumentMetadata {
  originalName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string | null;
  conversationId: string | null;
  processingId: string;
  source?: string;
  chunkIndex?: number;
  userId?: string | null;
  createdAt?: string;
  totalChunks?: number;
  pageNumber?: number | null;
  chunkHash?: string;
  sources?: SourceEntry[];
}

export type RawChunk = {
  pageContent: string
  metadata: {
    pageNumber?: number
    chunkIndex?: number
    processingId?: string
    conversationId?: string
    [key: string]: string | number | boolean | null | undefined;
  }
  status?: 'unchanged' | 'added' | 'removed'
}


export interface UploadDocumentFileParams {
  filePath: string;
  fileName: string;
  userId?: string;
  conversationId?: string;
  metadata?: DocumentMetadata;
}

interface ChunkUploadResult {
  chunkIndex: number;
  reused: boolean;
  page?: number | null;
  text?: string;
  error?: boolean;
}


/**
 * Télécharge et indexe un document avec déduplication optimisée pour Vercel/Next.js
 * - Optimisé pour minimiser le nombre de requêtes à la base de données
 * - Gère efficacement les contraintes de timeout Vercel (10s pour hobby, 60s pour pro)
 * - Robuste face aux erreurs réseau et aux problèmes de connexion
 */

export async function uploadDocumentFile(params: UploadDocumentFileParams) {
  const { filePath, fileName, userId, conversationId, metadata } = params;
  
  if (!metadata || !conversationId) {
    throw new Error("Les métadonnées et conversationId sont requis");
  }

  try {
    await ensureCollection();
    const collection = getCollection();
    
    // Chargement du document
    const ext = fileName.split(".").pop()?.toLowerCase();
    const docs: RawChunk[] = ext === "xlsx" || ext === "xls" 
      ? await loadAndSplitExcel(filePath) 
      : await loadAndSplitPDFWithContext(filePath);
    
    if (!docs.length) {
      throw new Error(`Aucun contenu extractible dans : ${fileName}`);
    }
    
    // Calcul des hashes
    const hashes = docs.map(d => sha256(d.pageContent));
    
    // Création des clés composites conversation_hash
    const createKey = (convId: string, hash: string) => `${convId}_${hash}`;
    
    // Récupération des documents existants pour cette conversation

      // Découpe en batchs de 100 pour respecter la limite AstraDB
      const MAX_IN = 100;
      type ExistingDoc = {
        metadata: {
          chunkHash?: string;
          conversationId?: string;
        };
      };

      const existingDocs: ExistingDoc[] = [];

      for (let i = 0; i < hashes.length; i += MAX_IN) {
        const batch = hashes.slice(i, i + MAX_IN);
        const batchDocs = await collection
          .find({ "metadata.conversationId": conversationId,"metadata.chunkHash": { $in: batch } })
          .toArray();
        existingDocs.push(...batchDocs);
      }

    
    // Set des clés composites existantes
    const existingKeys = new Set(
      existingDocs.map(d => createKey(
        d.metadata.conversationId,
        d.metadata.chunkHash
      ))
    );
    
    const BATCH_SIZE = 100;
    let uniqueCount = 0, reusedCount = 0;
    const uploadedChunks: ChunkUploadResult[] = [];
    
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      
      // Identifier les nouveaux chunks pour ce batch
      const newChunks = batch.filter((doc, j) => {
        const hash = hashes[i + j];
        return !existingKeys.has(createKey(conversationId, hash));
      });

      // Générer les embeddings uniquement pour les nouveaux chunks
      const vectors = newChunks.length > 0 
        ? await generateEmbeddingsBatch(newChunks.map(d => d.pageContent))
        : [];

      // Traitement du batch
      const batchPromises = batch.map(async (doc, j) => {
        const idx = i + j;
        const hash = hashes[idx];
        const key = createKey(conversationId, hash);

        if (existingKeys.has(key)) {
          reusedCount++;
          return {
            chunkIndex: idx,
            reused: true,
            page: doc.metadata.pageNumber,
            text: doc.pageContent.substring(0, 100) + "..."
          };
        }

        // Trouver l'index dans newChunks pour récupérer le bon vecteur
        const newChunkIndex = newChunks.findIndex(
          chunk => chunk.pageContent === doc.pageContent
        );

        const astraDocument = {
          $vector: vectors[newChunkIndex],
          text: doc.pageContent,
          metadata: {
            id: fileName + conversationId,
            source: fileName,
            chunkIndex: idx,
            userId: userId || undefined,
            conversationId,
            createdAt: new Date().toISOString(),
            chunkHash: hash,
            originalName: metadata.originalName,
            fileSize: metadata.fileSize,
            fileType: metadata.fileType,
            uploadedAt: metadata.uploadedAt,
            uploadedBy: metadata.uploadedBy,
            processingId: metadata.processingId,
            totalChunks: docs.length,
            pageNumber: doc.metadata.pageNumber ?? null
          }
        };

        await collection.insertOne(astraDocument);
        uniqueCount++;
        
        return {
          chunkIndex: idx,
          reused: false,
          page: doc.metadata.pageNumber,
          text: doc.pageContent.substring(0, 100) + "..."
        };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result, j) => {
        if (result.status === 'fulfilled') {
          uploadedChunks.push(result.value);
        } else {
          console.error(`Erreur chunk ${i + j}:`, result.reason);
          uploadedChunks.push({
            chunkIndex: i + j,
            reused: false,
            error: true
          });
        }
      });
    }

    // Enregistrement de l'événement
    if (userId) {
      await addMessageToConversation({
        conversationId,
        userId,
        role: ChatRole.SYSTEM,
        content: `[Upload] ${fileName}`,
        metadata: {
          id: fileName + conversationId,
          event: "upload",
          originalName: metadata.originalName,
          fileSize: metadata.fileSize,
          fileType: metadata.fileType,
          uploadedAt: metadata.uploadedAt,
          uploadedBy: userId,
          processingId: metadata.processingId,
          totalChunks: docs.length,
          uniqueChunks: uniqueCount,
          reusedChunks: reusedCount
        }
      });
    }

    return {
      success: true,
      chunks: docs.length,
      uniqueChunks: uniqueCount,
      reusedChunks: reusedCount,
      fileName,
      processingId: metadata.processingId
    };

  } catch (error) {
    console.error(`❌ Erreur upload ${fileName}:`, error);
    if (error instanceof Error && error.message.includes('FUNCTION_INVOCATION_TIMEOUT')) {
      throw new Error(`Timeout Vercel: document trop volumineux`);
    }
    throw error;
  }
}

