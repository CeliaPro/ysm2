// lib/astra/compareChunks.ts
import { getCollection, ensureCollection } from '@/lib/astra/client';
import { OpenAI } from 'openai';
import { diffWords } from 'diff';


/**
 * Configuration pour l'API OpenAI
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AstraDoc {
  _id: string;
  text: string;
  $vector?: number[];
  metadata: {
    source?: string;
    chunkIndex: number;
    userId?: string;
    conversationId?: string;
    createdAt: string;
    chunkHash?: string;
    processingId?: string;
    pageNumber?: number;
  };
}

export interface AstraChunk {
  _id: string;
  text: string;
  $vector: number[];
  metadata: {
    processingId: string;
    chunkIndex: number;
    chunkHash: string;
    pageNumber?: number;
  };
}

export interface ComparedChunk {
  chunkIndex: number;
  text: string;
  status: 'added' | 'removed' | 'unchanged' | 'modified';
  similarity?: number;
  confidence?: number;
  pageNumber?: number;
  llmAnalysis?: string;
  diffHighlight?: string;
}

export interface ComparisonResult {
  added: ComparedChunk[];
  removed: ComparedChunk[];
  unchanged: ComparedChunk[];
  modified: ComparedChunk[];
  statistics: {
    totalChunksDoc1: number;
    totalChunksDoc2: number;
    addedCount: number;
    removedCount: number;
    unchangedCount: number;
    modifiedCount: number;
    vectorMissingCount: number;
    llmEnhancedCount?: number;
    averageConfidence?: number;
  };
  comparedProcessingIds: {
    doc1: string;
    doc2: string;
  };
  pipeline: {
    steps: string[];
    duration: number;
    usedLLM: boolean;
  };
}

/**
 * Options avancées pour la comparaison de documents
 */
export interface AdvancedCompareOptions {
  // Seuils de similarité
  semanticSimilarityThreshold?: number; // Seuil pour considérer identique
  lexicalSimilarityThreshold?: number;  // Seuil pour considérer modifié
  
  // Options avancées
  useLLM?: boolean;                     // Utiliser l'IA pour affiner les résultats
  llmConfidenceThreshold?: number;      // Seuil de confiance LLM pour réviser des classifications
  enhanceModifiedChunks?: boolean;      // Générer des diff highlights pour les chunks modifiés
  computeConfidenceScores?: boolean;    // Calculer des scores de confiance pour chaque détection
  
  // Algorithmes à utiliser (pipeline hybride)
  useVectorSimilarity?: boolean;        // Utiliser similarité vectorielle (par défaut: true)
  useExactMatching?: boolean;           // Utiliser correspondance exacte (par défaut: true)
  useLexicalSimilarity?: boolean;       // Utiliser similarité lexicale (par défaut: true)
  
  // Limite des opérations LLM (pour contrôler les coûts)
  maxLLMOps?: number;                   // Limiter le nombre d'appels au LLM
}

/**
 * Convertit un document Astra en chunk pour la comparaison
 */
function convertToAstraChunk(doc: AstraDoc): AstraChunk | null {
  if (!doc.metadata.processingId || !doc.$vector) {
    console.warn(`[Skip] Invalid chunk ${doc._id}: missing vector or processingId`);
    return null;
  }

  return {
    _id: doc._id,
    text: doc.text,
    $vector: doc.$vector,
    metadata: {
      processingId: doc.metadata.processingId,
      chunkIndex: doc.metadata.chunkIndex,
      chunkHash: doc.metadata.chunkHash || '',
      pageNumber: doc.metadata.pageNumber,
    }
  };
}

/**
 * Calcule la similarité cosinus entre deux vecteurs
 */
function cosineSimilarity(a: unknown, b: unknown): number {
  // Defensive: only process arrays of equal length
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return (magA && magB) ? dot / (magA * magB) : 0;
}

/**
 * Calcule la similarité lexicale (Jaccard) entre deux textes
 */
function jaccardSimilarity(text1: string, text2: string): number {
  const tokenize = (text: string): Set<string> => {
    const tokens = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 0);
    return new Set(tokens);
  };

  const set1 = tokenize(text1);
  const set2 = tokenize(text2);
  
  // Calcul de l'intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Calcul de l'union
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 1.0; // Deux ensembles vides sont identiques
  
  return intersection.size / union.size;
}

/**
 * Calcule un score de confiance basé sur plusieurs métriques
 */
function calculateConfidenceScore(
  vectorSimilarity: number,
  lexicalSimilarity: number,
  exactMatch: boolean
): number {
  // Pondération des différentes métriques
  const weights = {
    vector: 0.5,
    lexical: 0.3,
    exact: 0.2
  };
  
  // Calcul du score pondéré
  const score = 
    (vectorSimilarity * weights.vector) +
    (lexicalSimilarity * weights.lexical) +
    (exactMatch ? weights.exact : 0);
    
  // Normalisation entre 0 et 1
  return Math.min(Math.max(score, 0), 1);
}

/**
 * Normalise un texte pour comparaison
 */
function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Génère un highlight des différences entre deux textes
 */
// function generateDiffHighlight(text1: string, text2: string): string {
//   // Version simplifiée - à améliorer avec une bibliothèque de diff
//   const words1 = text1.split(/\s+/);
//   const words2 = text2.split(/\s+/);
  
//   let result = '';
//   let i = 0, j = 0;
  
//   while (i < words1.length && j < words2.length) {
//     if (words1[i] === words2[j]) {
//       result += words1[i] + ' ';
//       i++;
//       j++;
//     } else {
//       // Recherche d'une correspondance à l'avant
//       let matchI = -1;
//       let matchJ = -1;
      
//       // Chercher dans une fenêtre
//       for (let k = 1; k < 4; k++) {
//         if (i + k < words1.length && words1[i + k] === words2[j]) {
//           matchI = i + k;
//           matchJ = j;
//           break;
//         }
//         if (j + k < words2.length && words1[i] === words2[j + k]) {
//           matchI = i;
//           matchJ = j + k;
//           break;
//         }
//       }
      
//       if (matchI >= 0) {
//         // Suppression
//         if (matchI > i) {
//           result += `<del>${words1.slice(i, matchI).join(' ')}</del> `;
//           i = matchI;
//         }
//         // Ajout
//         if (matchJ > j) {
//           result += `<ins>${words2.slice(j, matchJ).join(' ')}</ins> `;
//           j = matchJ;
//         }
//       } else {
//         // Pas de correspondance trouvée
//         result += `<del>${words1[i]}</del> `;
//         result += `<ins>${words2[j]}</ins> `;
//         i++;
//         j++;
//       }
//     }
//   }
  
//   // Traiter le reste
//   while (i < words1.length) {
//     result += `<del>${words1[i]}</del> `;
//     i++;
//   }
  
//   while (j < words2.length) {
//     result += `<ins>${words2[j]}</ins> `;
//     j++;
//   }
  
//   return result.trim();
// }


function generateDiffHighlight(text1: string, text2: string): string {
  const diff = diffWords(text1, text2);
  return diff.map(part => {
    if (part.added) return `<ins>${part.value}</ins>`;
    if (part.removed) return `<del>${part.value}</del>`;
    return part.value;
  }).join('');
}


/**
 * Analyse un chunk modifié avec LLM pour obtenir un avis plus précis
 */
async function analyzeDiffWithLLM(
  chunk1: string,
  chunk2: string,
  bestMatch: { similarity: number }
): Promise<{ status: 'unchanged' | 'modified'; analysis: string }> {
  try {
    const prompt = `
    Contexte: Je compare deux fragments de texte qui ont été identifiés comme potentiellement similaires.
    
    Fragment 1: "${chunk1}"
    
    Fragment 2: "${chunk2}"
    
    Similarité mesurée: ${bestMatch.similarity.toFixed(2)}
    
    Analyse professionnelle: Détermine si ces fragments sont réellement identiques sur le plan sémantique (mêmes idées, même sens) malgré des différences de formulation, ou s'ils présentent des différences notables de sens ou d'information.
    
    Réponds avec le format suivant:
    1. Classification: [unchanged/modified]
    2. Explication: [explication détaillée]
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: 'system', content: 'Tu es un expert en analyse textuelle qui aide à détecter les nuances et différences sémantiques entre textes similaires.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 500
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    // Extraction de la classification et de l'analyse
    const classificationMatch = content.match(/Classification:\s*(unchanged|modified)/i);
    const status = classificationMatch 
      ? (classificationMatch[1].toLowerCase() as 'unchanged' | 'modified') 
      : 'modified';
      
    // Extraction de l'explication
    const analysisMatch = content.match(/Explication:\s*([\s\S]+)/i);
    const analysis = analysisMatch ? analysisMatch[1].trim() : content;
    
    return { status, analysis };
  } catch (error) {
    console.error('Erreur lors de l\'analyse LLM:', error);
    // En cas d'erreur, on revient à la classification originale
    return { 
      status: bestMatch.similarity >= 0.9 ? 'unchanged' : 'modified',
      analysis: `Erreur LLM - classification basée sur similarité: ${bestMatch.similarity}`
    };
  }
}

/**
 * Fonction principale de comparaison de documents avec pipeline hybride
 */
export async function compareDocumentChunks(
  doc1ProcessingId: string,
  doc2ProcessingId: string,
  options: AdvancedCompareOptions = {}
): Promise<ComparisonResult> {
  if (!doc1ProcessingId || !doc2ProcessingId) {
    throw new Error('Both processing IDs must be provided.');
  }
  
  // Début du chronomètre pour mesurer la performance
  const startTime = Date.now();
  const pipelineSteps: string[] = [];
  
  // Configuration des seuils et options par défaut
  const settings = {
    thresholds: {
      unchanged: options.semanticSimilarityThreshold ?? 0.95,
      modified: options.lexicalSimilarityThreshold ?? 0.7
    },
    algorithms: {
      useVectorSimilarity: options.useVectorSimilarity ?? true,
      useExactMatching: options.useExactMatching ?? true,
      useLexicalSimilarity: options.useLexicalSimilarity ?? true
    },
    llm: {
      use: options.useLLM ?? false,
      confidenceThreshold: options.llmConfidenceThreshold ?? 0.8,
      maxOperations: options.maxLLMOps ?? 10,
      enhanceModified: options.enhanceModifiedChunks ?? false
    },
    computeConfidence: options.computeConfidenceScores ?? false
  };
  
  pipelineSteps.push('Configuration du pipeline');
  
  await ensureCollection();
  const collection = getCollection();
  
  // Préparation de la projection pour la base de données
  const findOptions = { 
    projection: { 
      "$vector": 1 as const, 
      "text": 1 as const, 
      "metadata": 1 as const 
    } 
  };

  pipelineSteps.push('Requête à la base de données');
  
  // Extraction des chunks des documents
  const [doc1Raw, doc2Raw] = await Promise.all([
    collection.find({ 'metadata.processingId': doc1ProcessingId }, findOptions).toArray() as Promise<AstraDoc[]>,
    collection.find({ 'metadata.processingId': doc2ProcessingId }, findOptions).toArray() as Promise<AstraDoc[]>
  ]);

  // Conversion en chunks Astra avec validation
  const doc1Chunks = doc1Raw.map(convertToAstraChunk).filter((c): c is AstraChunk => !!c);
  const doc2Chunks = doc2Raw.map(convertToAstraChunk).filter((c): c is AstraChunk => !!c);

  if (!doc1Chunks.length || !doc2Chunks.length) {
    throw new Error('One or both documents have no valid chunks with vectors.');
  }

  pipelineSteps.push('Traitement des chunks');
  console.log(`[Chunks] Found ${doc1Chunks.length} chunks for doc1`);
  console.log(`[Chunks] Found ${doc2Chunks.length} chunks for doc2`);

  // Containers pour les résultats
  const added: ComparedChunk[] = [];
  const removed: ComparedChunk[] = [];
  const unchanged: ComparedChunk[] = [];
  const modified: ComparedChunk[] = [];
  
  // Cache pour les calculs de similarité
  const similarityCache = new Map<string, number>();
  
  // Pour chaque chunk du premier document
  for (const chunk of doc1Chunks) {
    // Recherche du meilleur match
    const bestMatch = doc2Chunks.reduce((best, other) => {
      // 1. Test d'identité exacte par hash si disponible
      if (settings.algorithms.useExactMatching && 
          chunk.metadata.chunkHash && 
          other.metadata.chunkHash &&
          chunk.metadata.chunkHash === other.metadata.chunkHash) {
        return { chunk: other, similarity: 1, lexicalSimilarity: 1, exactMatch: true };
      }
      
      // 2. Calcul de similarité vectorielle si activé
      let vectorSimilarity = 0;
      if (settings.algorithms.useVectorSimilarity) {
        const cacheKey = `${chunk._id}:${other._id}`;
        if (similarityCache.has(cacheKey)) {
          vectorSimilarity = similarityCache.get(cacheKey)!;
        } else {
          vectorSimilarity = cosineSimilarity(chunk.$vector, other.$vector);
          similarityCache.set(cacheKey, vectorSimilarity);
        }
      }
      
      // 3. Calcul de similarité lexicale si activé
      let lexicalSimilarity = 0;
      if (settings.algorithms.useLexicalSimilarity) {
        lexicalSimilarity = jaccardSimilarity(chunk.text, other.text);
      }
      
      // Combinaison des métriques
      const combinedSimilarity = settings.algorithms.useVectorSimilarity && settings.algorithms.useLexicalSimilarity
        ? (vectorSimilarity * 0.7) + (lexicalSimilarity * 0.3)  // Pondération des similarités
        : settings.algorithms.useVectorSimilarity
          ? vectorSimilarity
          : lexicalSimilarity;
      
      return combinedSimilarity > best.similarity
        ? { 
            chunk: other, 
            similarity: combinedSimilarity,
            lexicalSimilarity,
            exactMatch: false
          }
        : best;
    }, { 
      chunk: null as AstraChunk | null, 
      similarity: -1,
      lexicalSimilarity: 0,
      exactMatch: false
    });

    // Calcul du score de confiance si demandé
    const confidence = settings.computeConfidence 
      ? calculateConfidenceScore(
          bestMatch.similarity, 
          bestMatch.lexicalSimilarity, 
          bestMatch.exactMatch
        )
      : undefined;
      
    const match = bestMatch.chunk;
    const sim = bestMatch.similarity;

    // Classification initiale basée sur la similarité
    if (sim >= settings.thresholds.unchanged) {
      unchanged.push({
        chunkIndex: chunk.metadata.chunkIndex,
        text: chunk.text,
        status: 'unchanged',
        similarity: sim,
        confidence,
        pageNumber: chunk.metadata.pageNumber
      });
    } else if (sim >= settings.thresholds.modified) {
      modified.push({
        chunkIndex: chunk.metadata.chunkIndex,
        text: chunk.text,
        status: 'modified',
        similarity: sim,
        confidence,
        pageNumber: chunk.metadata.pageNumber,
        // Si activé, générer un diff highlight
        diffHighlight: settings.llm.enhanceModified && match 
          ? generateDiffHighlight(chunk.text, match.text) 
          : undefined
      });
    } else {
      removed.push({
        chunkIndex: chunk.metadata.chunkIndex,
        text: chunk.text,
        status: 'removed',
        confidence,
        pageNumber: chunk.metadata.pageNumber
      });
    }
  }

  // Trouver tous les chunks ajoutés du document 2 (pas de correspondance dans doc1)
  for (const chunk of doc2Chunks) {
    const isKnown = [...unchanged, ...modified].some(c => {
      if (settings.algorithms.useExactMatching) {
        return normalize(c.text) === normalize(chunk.text);
      }
      
      return false;
    });
    
    if (!isKnown) {
      added.push({
        chunkIndex: chunk.metadata.chunkIndex,
        text: chunk.text,
        status: 'added',
        confidence: settings.computeConfidence ? 0.95 : undefined, // Haute confiance pour 'ajouté'
        pageNumber: chunk.metadata.pageNumber
      });
    }
  }

  pipelineSteps.push('Classification initiale des chunks');
  
  // Utilisation du LLM pour l'analyse des chunks modifiés avec confiance faible
  let llmEnhancedCount = 0;
  
  if (settings.llm.use && modified.length > 0) {
    pipelineSteps.push('Analyse LLM des chunks ambigus');
    
    // Sélection des chunks à analyser par LLM (ceux avec faible confiance)
    const llmCandidates = modified
      .filter(chunk => !chunk.confidence || chunk.confidence < settings.llm.confidenceThreshold)
      .slice(0, settings.llm.maxOperations);
      
    console.log(`[LLM] Analyzing ${llmCandidates.length} ambiguous chunks`);
    
    // Analyse parallèle avec LLM
    const llmAnalysisPromises = llmCandidates.map(async (chunk) => {
      const correspondingChunk = doc2Chunks.find(c => 
        cosineSimilarity(
          doc1Chunks.find(d => d.metadata.chunkIndex === chunk.chunkIndex)!.$vector,
          c.$vector
        ) >= settings.thresholds.modified
      );
      
      if (!correspondingChunk) return null;
      
      const analysis = await analyzeDiffWithLLM(
        chunk.text,
        correspondingChunk.text,
        { similarity: chunk.similarity || 0 }
      );
      
      return {
        index: chunk.chunkIndex,
        analysis: analysis.analysis,
        status: analysis.status
      };
    });
    
    const llmResults = await Promise.all(llmAnalysisPromises);
    
    // Appliquer les résultats de l'analyse LLM
    llmResults.forEach(result => {
      if (!result) return;
      
      const chunkIndex = modified.findIndex(c => c.chunkIndex === result.index);
      if (chunkIndex >= 0) {
        const chunk = modified[chunkIndex];
        
        // Mise à jour avec l'analyse LLM
        chunk.llmAnalysis = result.analysis;
        
        // Reclassification si le LLM indique "unchanged"
        if (result.status === 'unchanged') {
          chunk.status = 'unchanged';
          unchanged.push(chunk);
          modified.splice(chunkIndex, 1);
        }
        
        llmEnhancedCount++;
      }
    });
    
    pipelineSteps.push(`Analyse LLM complétée (${llmEnhancedCount} chunks)`);
  }

  // Calcul des statistiques
  const stats = {
    totalChunksDoc1: doc1Raw.length,
    totalChunksDoc2: doc2Raw.length,
    addedCount: added.length,
    removedCount: removed.length,
    unchangedCount: unchanged.length,
    modifiedCount: modified.length,
    vectorMissingCount:
      doc1Raw.length - doc1Chunks.length +
      doc2Raw.length - doc2Chunks.length,
    llmEnhancedCount: llmEnhancedCount,
    averageConfidence: settings.computeConfidence 
      ? [...added, ...removed, ...unchanged, ...modified]
          .reduce((sum, chunk) => sum + (chunk.confidence || 0), 0) / 
          (added.length + removed.length + unchanged.length + modified.length)
      : undefined
  };

  // Fin du chronomètre
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  pipelineSteps.push(`Finalisation (${duration}ms)`);
  
  console.log(`[Compare Done] Added: ${stats.addedCount}, Removed: ${stats.removedCount}, Modified: ${stats.modifiedCount}, Unchanged: ${stats.unchangedCount}`);
  if (llmEnhancedCount > 0) {
    console.log(`[LLM Enhanced] ${llmEnhancedCount} chunks analyzed`);
  }

  return {
    added: added.sort((a, b) => a.chunkIndex - b.chunkIndex),
    removed: removed.sort((a, b) => a.chunkIndex - b.chunkIndex),
    unchanged: unchanged.sort((a, b) => a.chunkIndex - b.chunkIndex),
    modified: modified.sort((a, b) => a.chunkIndex - b.chunkIndex),
    statistics: stats,
    comparedProcessingIds: {
      doc1: doc1ProcessingId,
      doc2: doc2ProcessingId
    },
    pipeline: {
      steps: pipelineSteps,
      duration,
      usedLLM: settings.llm.use && llmEnhancedCount > 0
    }
  };
}

/**
 * Récupère les détails des chunks pour un document spécifique
 */
export async function getChunkComparisonDetails(processingId: string): Promise<AstraChunk[]> {
  await ensureCollection();
  const collection = getCollection();

  // Projection pour la base de données
  const findOptions = { 
    projection: { 
      "$vector": 1 as const, 
      "text": 1 as const, 
      "metadata": 1 as const 
    } 
  };
  
  const rawDocs = await collection
    .find({ 'metadata.processingId': processingId }, findOptions)
    .toArray() as AstraDoc[];

  return rawDocs
    .map(convertToAstraChunk)
    .filter((chunk): chunk is AstraChunk => chunk !== null);
}