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
        
      // 3️⃣ Format results with complete metadata
      if (!results.length) {
        console.log('No relevant documents found for conversation:', conversationId);
        return "No relevant context found.";
      }

      return results
        .map((doc, index) => {
          const metadata = doc.metadata as { 
            source?: string; 
            chunkIndex?: number;
            pageNumber?: number;
            originalName?: string;
            fileType?: string;
            totalChunks?: number;
          };

          // Extraire les références de sections du texte (3.1.5.2, 3.1.6.7, etc.)
          const sectionRefs = extractSectionReferences(doc.text);
          
          // Construire l'en-tête avec toutes les métadonnées importantes
          let header = `📄 Document ${index + 1}:\n`;
          header += `   • Source: ${metadata.originalName || metadata.source || 'N/A'}\n`;
          header += `   • Page: ${metadata.pageNumber || 'N/A'}\n`;
          header += `   • Chunk: ${(metadata.chunkIndex || 0) + 1}/${metadata.totalChunks || 'N/A'}\n`;
          
          if (sectionRefs.length > 0) {
            header += `   • Sections: ${sectionRefs.join(', ')}\n`;
          }
          
          header += `   • Type: ${metadata.fileType || 'N/A'}\n`;
          header += `\n📝 Contenu:\n${doc.text}`;
          
          return header;
        })
        .join("\n\n" + "=".repeat(80) + "\n\n");

    } catch (e) {
      console.error("Vector search failed:", e);
      throw e;
    }
}

// Fonction helper pour extraire les références de sections
function extractSectionReferences(text: string): string[] {
  const sectionPattern = /\d+\.\d+(\.\d+)*(\.\d+)*/g;
  const matches = text.match(sectionPattern) || [];
  
  // Supprimer les doublons et garder seulement les références principales
  const uniqueRefs = [...new Set(matches)]
    .filter(ref => ref.split('.').length >= 2) // Au moins 2 niveaux (ex: 3.1)
    .sort();
    
  return uniqueRefs;
}

// Version alternative si vous voulez un format plus concis
export async function getContextFromQueryConcise(query: string, conversationId: string): Promise<string> {
    try {
      const embedRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
        encoding_format: "float",
      });
      
      const vector = embedRes.data[0].embedding;
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

      if (!results.length) {
        return "No relevant context found.";
      }

      return results
        .map((doc) => {
          const metadata = doc.metadata as { 
            source?: string; 
            pageNumber?: number;
            originalName?: string;
          };

          const sectionRefs = extractSectionReferences(doc.text);
          const referencesText = sectionRefs.length > 0 ? ` [Sections: ${sectionRefs.join(', ')}]` : '';
          
          return `[${metadata.originalName || 'Document'} - Page ${metadata.pageNumber || 'N/A'}${referencesText}]\n${doc.text}`;
        })
        .join("\n\n---\n\n");

    } catch (e) {
      console.error("Vector search failed:", e);
      throw e;
    }
}