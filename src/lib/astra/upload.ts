import { getCollection, ensureCollection } from "./client";
import { loadAndSplitPDFWithContext } from "./loader";
import { loadAndSplitExcel } from "./loaderExcel";
import { generateEmbeddingsBatch } from "./embedding";
import { addMessageToConversation } from "../actions/conversations/conversation";
import { ChatRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/utils/hash";

// Types précis pour une meilleure sécurité
export interface SourceEntry {
  documentId: string;
  fileName: string;
  addedAt: string;
  pageNumber: number | null;
}

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

// Type pour les métadonnées dans les messages
export interface MessageMetadata {
  event: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string | null;
  processingId: string;
  id?: string;
  totalChunks?: number;
  uniqueChunks?: number;
  reusedChunks?: number;
  [key: string]: string | number | boolean | null | undefined;
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

// Type pour le résultat de l'upload de document
interface UploadDocumentResult {
  success: boolean;
  alreadyExists?: boolean;
  fileName: string;
  processingId: string;
  chunks?: number;
  uniqueChunks?: number;
  reusedChunks?: number;
}

// Fonction pour vérifier si un document entier existe déjà
async function isDocumentAlreadyUploaded(metadata: DocumentMetadata): Promise<boolean> {
  if (!metadata.conversationId) return false;
  
  try {
    // Recherche dans Prisma un message avec les mêmes caractéristiques pour cette conversation
    const existingMessages = await prisma.message.findFirst({
      where: {
        conversationId: metadata.conversationId,
        metadata: {
          path: ["event"],
          equals: "upload"
        },
        AND: [
          {
            metadata: {
              path: ["originalName"],
              equals: metadata.originalName
            }
          },
          {
            metadata: {
              path: ["fileSize"],
              equals: metadata.fileSize
            }
          },
          {
            metadata: {
              path: ["fileType"],
              equals: metadata.fileType
            }
          }
        ]
      }
    });

    return !!existingMessages;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'existence du document:", error);
    return false; // En cas d'erreur, permettre l'upload pour éviter des problèmes
  }
}

/**
 * Récupère les métadonnées d'un document existant
 */
async function getExistingDocumentMetadata(metadata: DocumentMetadata): Promise<MessageMetadata | null> {
  if (!metadata.conversationId) return null;
  
  try {
    const result = await prisma.message.findFirst({
      where: {
        conversationId: metadata.conversationId,
        metadata: {
          path: ["event"],
          equals: "upload"
        },
        AND: [
          { metadata: { path: ["originalName"], equals: metadata.originalName } },
          { metadata: { path: ["fileSize"], equals: metadata.fileSize } }
        ]
      },
      select: {
        metadata: true
      }
    });
    
    // Prisma retourne les métadonnées comme une valeur JSON, on le type explicitement
    return result?.metadata as unknown as MessageMetadata || null;
  } catch (error) {
    console.error("Erreur lors de la récupération des métadonnées:", error);
    return null;
  }
}

/**
 * Télécharge et indexe un document avec déduplication optimisée pour Vercel/Next.js
 * - Optimisé pour minimiser le nombre de requêtes à la base de données
 * - Gère efficacement les contraintes de timeout Vercel (10s pour hobby, 60s pour pro)
 * - Robuste face aux erreurs réseau et aux problèmes de connexion
 */
export async function uploadDocumentFile(params: UploadDocumentFileParams): Promise<UploadDocumentResult> {
  const { filePath, fileName, userId, conversationId, metadata } = params;
  
  if (!metadata || !conversationId) {
    throw new Error("Les métadonnées et conversationId sont requis");
  }

  try {
    // Vérifier si le document entier existe déjà
    if (await isDocumentAlreadyUploaded(metadata)) {
      console.log(`⚠️ Document déjà présent, vectorisation ignorée: ${fileName}`);
      
      // Récupérer les stats du document précédent si disponibles
      const existingMeta = await getExistingDocumentMetadata(metadata);
      
      // Retourne les informations sans relancer la vectorisation
      return {
        success: true,
        alreadyExists: true,
        fileName,
        processingId: metadata.processingId,
        chunks: existingMeta?.totalChunks || 0,
        uniqueChunks: existingMeta?.uniqueChunks || 0,
        reusedChunks: existingMeta?.reusedChunks || 0
      };
    }

    // Si le document n'existe pas, continuer avec la vectorisation
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
      existingDocs.push(...batchDocs.map(doc => ({ metadata: doc.metadata })));
    }
    
    // Set des clés composites existantes
    const existingKeys = new Set(
      existingDocs.map(d => createKey(
        d.metadata.conversationId ?? "",
        d.metadata.chunkHash ?? ""
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

          // Récupérer le chunk existant avec le même hash pour extraire son vecteur
          const existingDoc = await collection.findOne({ 
            "metadata.conversationId": conversationId,
            "metadata.chunkHash": hash 
          });

          if (existingDoc && existingDoc.$vector) {
            const astraDocument = {
              $vector: existingDoc.$vector,
              text: doc.pageContent,
              metadata: {
                id: fileName + conversationId,
                source: fileName,
                chunkIndex: idx,
                userId: userId || null,
                conversationId,
                createdAt: new Date().toISOString(),
                chunkHash: hash,
                originalName: metadata.originalName,
                fileSize: metadata.fileSize,
                fileType: metadata.fileType,
                uploadedAt: metadata.uploadedAt,
                uploadedBy: metadata.uploadedBy,
                processingId: metadata.processingId, // << ici le nouveau processingId
                totalChunks: docs.length,
                pageNumber: doc.metadata.pageNumber ?? null
              }
            };

            await collection.insertOne(astraDocument);
          }

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
            userId: userId || null,
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