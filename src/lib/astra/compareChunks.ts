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

export interface AdvancedCompareOptions {
  semanticSimilarityThreshold?: number;
  lexicalSimilarityThreshold?: number;
  useLLM?: boolean;
  llmConfidenceThreshold?: number;
  enhanceModifiedChunks?: boolean;
  computeConfidenceScores?: boolean;
  useVectorSimilarity?: boolean;
  useExactMatching?: boolean;
  useLexicalSimilarity?: boolean;
  maxLLMOps?: number;
  batchSize?: number;
}

// Cache global pour les calculs coûteux
interface SimilarityCache {
  vector: Map<string, number>;
  lexical: Map<string, number>;
  tokenized: Map<string, Set<string>>;
}

const globalCache: SimilarityCache = {
  vector: new Map(),
  lexical: new Map(),
  tokenized: new Map(),
};

/**
 * Convertit un document Astra en chunk pour la comparaison
 */
function convertToAstraChunk(doc: { 
  _id: any;
  text: string;
  $vector?: number[];
  metadata?: {
    processingId?: string;
    chunkIndex: number;
    chunkHash?: string;
    pageNumber?: number;
  };
}): AstraChunk | null {
  if (!doc.metadata?.processingId || !doc.$vector) {
    return null;
  }

  // Safely convert _id to string, handling null and primitive types
  let idStr: string;
  if (doc._id === null || doc._id === undefined) {
    return null;
  } else if (typeof doc._id === 'object' && typeof doc._id.toString === 'function') {
    idStr = doc._id.toString();
  } else {
    idStr = String(doc._id);
  }

  return {
    _id: idStr,
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
 * Calcule la similarité cosinus entre deux vecteurs (optimisé)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dot = 0;
  let magA = 0;
  let magB = 0;
  
  // Une seule boucle pour tous les calculs
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    dot += ai * bi;
    magA += ai * ai;
    magB += bi * bi;
  }
  
  const magnitude = Math.sqrt(magA * magB);
  return magnitude ? dot / magnitude : 0;
}

/**
 * Tokenise un texte avec cache
 */
function tokenizeWithCache(text: string): Set<string> {
  if (globalCache.tokenized.has(text)) {
    return globalCache.tokenized.get(text)!;
  }
  
  const tokens = new Set(
    text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 0)
  );
  
  globalCache.tokenized.set(text, tokens);
  return tokens;
}

/**
 * Calcule la similarité lexicale (Jaccard) avec cache
 */
function jaccardSimilarity(text1: string, text2: string): number {
  const cacheKey = `${text1.length}:${text2.length}:${text1.slice(0, 50)}`;
  
  if (globalCache.lexical.has(cacheKey)) {
    return globalCache.lexical.get(cacheKey)!;
  }
  
  const set1 = tokenizeWithCache(text1);
  const set2 = tokenizeWithCache(text2);
  
  // Calcul optimisé de l'intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  const similarity = union.size === 0 ? 1.0 : intersection.size / union.size;
  
  globalCache.lexical.set(cacheKey, similarity);
  return similarity;
}

/**
 * Pre-filtre les candidats pour réduire l'espace de recherche
 */
function preFilterCandidates(
  query: AstraChunk, 
  candidates: AstraChunk[],
  maxCandidates: number = 50
): AstraChunk[] {
  // Filtres rapides pour réduire l'espace de recherche
  const filtered = candidates.filter(candidate => {
    // Filtre par différence de longueur (textes trop différents)
    const lengthDiff = Math.abs(query.text.length - candidate.text.length);
    const maxLengthDiff = Math.max(query.text.length, candidate.text.length) * 0.5;
    
    return lengthDiff <= maxLengthDiff;
  });
  
  // Si encore trop de candidats, prendre les plus proches par longueur
  if (filtered.length > maxCandidates) {
    return filtered
      .sort((a, b) => 
        Math.abs(query.text.length - a.text.length) - 
        Math.abs(query.text.length - b.text.length)
      )
      .slice(0, maxCandidates);
  }
  
  return filtered;
}

/**
 * Calcule un score de confiance basé sur plusieurs métriques
 */
function calculateConfidenceScore(
  vectorSimilarity: number,
  lexicalSimilarity: number,
  exactMatch: boolean
): number {
  const weights = { vector: 0.5, lexical: 0.3, exact: 0.2 };
  
  const score = 
    (vectorSimilarity * weights.vector) +
    (lexicalSimilarity * weights.lexical) +
    (exactMatch ? weights.exact : 0);
    
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
    
    const classificationMatch = content.match(/Classification:\s*(unchanged|modified)/i);
    const status = classificationMatch 
      ? (classificationMatch[1].toLowerCase() as 'unchanged' | 'modified') 
      : 'modified';
      
    const analysisMatch = content.match(/Explication:\s*([\s\S]+)/i);
    const analysis = analysisMatch ? analysisMatch[1].trim() : content;
    
    return { status, analysis };
  } catch (error) {
    console.error('Erreur lors de l\'analyse LLM:', error);
    return { 
      status: bestMatch.similarity >= 0.9 ? 'unchanged' : 'modified',
      analysis: `Erreur LLM - classification basée sur similarité: ${bestMatch.similarity}`
    };
  }
}

/**
 * Trouve la meilleure correspondance pour un chunk (optimisé)
 */
function findBestMatch(
  chunk: AstraChunk,
  candidates: AstraChunk[],
  exactMatchIndex: Map<string, AstraChunk>,
  settings: {
    algorithms: {
      useVectorSimilarity: boolean;
      useExactMatching: boolean;
      useLexicalSimilarity: boolean;
    };
    thresholds: {
      unchanged: number;
      modified: number;
    };
    llm: {
      enhanceModified: boolean;
    };
    computeConfidence: boolean;
  }
): {
  chunk: AstraChunk | null;
  similarity: number;
  lexicalSimilarity: number;
  exactMatch: boolean;
} {
  // 1. Test de correspondance exacte par hash (O(1))
  if (settings.algorithms.useExactMatching && chunk.metadata.chunkHash) {
    const exactMatch = exactMatchIndex.get(chunk.metadata.chunkHash);
    if (exactMatch) {
      return {
        chunk: exactMatch,
        similarity: 1,
        lexicalSimilarity: 1,
        exactMatch: true
      };
    }
  }
  
  // 2. Pre-filtrage des candidats pour réduire la complexité
  const filteredCandidates = preFilterCandidates(chunk, candidates);
  
  // 3. Recherche de la meilleure correspondance dans l'espace réduit
  let bestMatch = {
    chunk: null as AstraChunk | null,
    similarity: -1,
    lexicalSimilarity: 0,
    exactMatch: false
  };
  
  for (const candidate of filteredCandidates) {
    let vectorSimilarity = 0;
    let lexicalSimilarity = 0;
    
    // Calcul de similarité vectorielle avec cache
    if (settings.algorithms.useVectorSimilarity) {
      const cacheKey = `${chunk._id}:${candidate._id}`;
      
      if (globalCache.vector.has(cacheKey)) {
        vectorSimilarity = globalCache.vector.get(cacheKey)!;
      } else {
        vectorSimilarity = cosineSimilarity(chunk.$vector, candidate.$vector);
        globalCache.vector.set(cacheKey, vectorSimilarity);
      }
    }
    
    // Calcul de similarité lexicale avec cache
    if (settings.algorithms.useLexicalSimilarity) {
      lexicalSimilarity = jaccardSimilarity(chunk.text, candidate.text);
    }
    
    // Combinaison des métriques
    const combinedSimilarity = settings.algorithms.useVectorSimilarity && settings.algorithms.useLexicalSimilarity
      ? (vectorSimilarity * 0.7) + (lexicalSimilarity * 0.3)
      : settings.algorithms.useVectorSimilarity
        ? vectorSimilarity
        : lexicalSimilarity;
    
    if (combinedSimilarity > bestMatch.similarity) {
      bestMatch = {
        chunk: candidate,
        similarity: combinedSimilarity,
        lexicalSimilarity,
        exactMatch: false
      };
    }
  }
  
  return bestMatch;
}

/**
 * Traite un batch de chunks
 */
async function processBatch(
  chunks: AstraChunk[],
  doc2Chunks: AstraChunk[],
  exactMatchIndex: Map<string, AstraChunk>,
  settings: {
    algorithms: {
      useVectorSimilarity: boolean;
      useExactMatching: boolean;
      useLexicalSimilarity: boolean;
    };
    thresholds: {
      unchanged: number;
      modified: number;
    };
    llm: {
      enhanceModified: boolean;
    };
    computeConfidence: boolean;
  }
): Promise<{
  unchanged: ComparedChunk[];
  modified: ComparedChunk[];
  removed: ComparedChunk[];
}> {
  const unchanged: ComparedChunk[] = [];
  const modified: ComparedChunk[] = [];
  const removed: ComparedChunk[] = [];
  
  for (const chunk of chunks) {
    const bestMatch = findBestMatch(chunk, doc2Chunks, exactMatchIndex, settings);
    
    const confidence = settings.computeConfidence 
      ? calculateConfidenceScore(
          bestMatch.similarity, 
          bestMatch.lexicalSimilarity, 
          bestMatch.exactMatch
        )
      : undefined;
      
    const sim = bestMatch.similarity;

    // Classification basée sur la similarité
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
        diffHighlight: settings.llm.enhanceModified && bestMatch.chunk 
          ? generateDiffHighlight(chunk.text, bestMatch.chunk.text) 
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
  
  return { unchanged, modified, removed };
}

/**
 * Fonction principale de comparaison de documents avec pipeline hybride optimisé
 */
export async function compareDocumentChunks(
  doc1ProcessingId: string,
  doc2ProcessingId: string,
  options: AdvancedCompareOptions = {}
): Promise<ComparisonResult> {
  if (!doc1ProcessingId || !doc2ProcessingId) {
    throw new Error('Both processing IDs must be provided.');
  }
  
  const startTime = Date.now();
  const pipelineSteps: string[] = [];
  
  // Configuration optimisée
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
    computeConfidence: options.computeConfidenceScores ?? false,
    batchSize: options.batchSize ?? 100
  };
  
  pipelineSteps.push('Configuration optimisée du pipeline');
  
  await ensureCollection();
  const collection = getCollection();
  
  // OPTION 1: Replace aggregate with separate find queries
  pipelineSteps.push('Requête à la base de données');
  
  // Fetch documents for both processing IDs separately
  const findOptions = { 
    projection: { 
      "$vector": 1 as const, 
      "text": 1 as const, 
      "metadata": 1 as const 
    } 
  };
  
  const [doc1Raw, doc2Raw] = await Promise.all([
    collection.find({ 'metadata.processingId': doc1ProcessingId }, findOptions).toArray(),
    collection.find({ 'metadata.processingId': doc2ProcessingId }, findOptions).toArray()
  ]);

  // Conversion des chunks
  const doc1Chunks = doc1Raw.map(convertToAstraChunk).filter((c): c is AstraChunk => !!c);
  const doc2Chunks = doc2Raw.map(convertToAstraChunk).filter((c): c is AstraChunk => !!c);

  if (!doc1Chunks.length || !doc2Chunks.length) {
    throw new Error('One or both documents have no valid chunks with vectors.');
  }

  pipelineSteps.push(`Traitement des chunks (${doc1Chunks.length} vs ${doc2Chunks.length})`);
  
  // Création d'un index pour les correspondances exactes (O(1))
  const exactMatchIndex = new Map<string, AstraChunk>();
  doc2Chunks.forEach(chunk => {
    if (chunk.metadata.chunkHash) {
      exactMatchIndex.set(chunk.metadata.chunkHash, chunk);
    }
  });
  
  pipelineSteps.push('Index de correspondance exacte créé');

  // Traitement par batches pour éviter la surcharge mémoire
  const allUnchanged: ComparedChunk[] = [];
  const allModified: ComparedChunk[] = [];
  const allRemoved: ComparedChunk[] = [];
  
  const batchSize = settings.batchSize;
  const numBatches = Math.ceil(doc1Chunks.length / batchSize);
  
  for (let i = 0; i < numBatches; i++) {
    const startIdx = i * batchSize;
    const endIdx = Math.min(startIdx + batchSize, doc1Chunks.length);
    const batch = doc1Chunks.slice(startIdx, endIdx);
    
    const batchResults = await processBatch(batch, doc2Chunks, exactMatchIndex, settings);
    
    allUnchanged.push(...batchResults.unchanged);
    allModified.push(...batchResults.modified);
    allRemoved.push(...batchResults.removed);
  }
  
  pipelineSteps.push(`Traitement par batches complété (${numBatches} batches)`);

  // Détection des chunks ajoutés (optimisée)
  const knownTexts = new Set([
    ...allUnchanged.map(c => normalize(c.text)),
    ...allModified.map(c => normalize(c.text))
  ]);
  
  const added: ComparedChunk[] = doc2Chunks
    .filter(chunk => !knownTexts.has(normalize(chunk.text)))
    .map(chunk => ({
      chunkIndex: chunk.metadata.chunkIndex,
      text: chunk.text,
      status: 'added' as const,
      confidence: settings.computeConfidence ? 0.95 : undefined,
      pageNumber: chunk.metadata.pageNumber
    }));

  pipelineSteps.push('Détection des chunks ajoutés');

  // Analyse LLM optimisée (en parallèle avec limite)
  let llmEnhancedCount = 0;
  
  if (settings.llm.use && allModified.length > 0) {
    pipelineSteps.push('Analyse LLM des chunks ambigus');
    
    const llmCandidates = allModified
      .filter(chunk => !chunk.confidence || chunk.confidence < settings.llm.confidenceThreshold)
      .slice(0, settings.llm.maxOperations);
      
    if (llmCandidates.length > 0) {
      // Traitement en parallèle avec Promise.all
      const llmPromises = llmCandidates.map(async (chunk) => {
        const correspondingChunk = doc2Chunks.find(c => 
          cosineSimilarity(
            doc1Chunks.find(d => d.metadata.chunkIndex === chunk.chunkIndex)!.$vector,
            c.$vector
          ) >= settings.thresholds.modified
        );
        
        if (!correspondingChunk) return null;
        
        try {
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
        } catch (error) {
          console.warn(`LLM analysis failed for chunk ${chunk.chunkIndex}:`, error);
          return null;
        }
      });
      
      const llmResults = (await Promise.allSettled(llmPromises))
        .map(result => result.status === 'fulfilled' ? result.value : null)
        .filter(result => result !== null);
      
      // Application des résultats LLM
      llmResults.forEach(result => {
        if (!result) return;
        
        const chunkIndex = allModified.findIndex(c => c.chunkIndex === result.index);
        if (chunkIndex >= 0) {
          const chunk = allModified[chunkIndex];
          chunk.llmAnalysis = result.analysis;
          
          if (result.status === 'unchanged') {
            chunk.status = 'unchanged';
            allUnchanged.push(chunk);
            allModified.splice(chunkIndex, 1);
          }
          
          llmEnhancedCount++;
        }
      });
    }
    
    pipelineSteps.push(`Analyse LLM complétée (${llmEnhancedCount} chunks)`);
  }

  // Statistiques finales
  const stats = {
    totalChunksDoc1: doc1Raw.length,
    totalChunksDoc2: doc2Raw.length,
    addedCount: added.length,
    removedCount: allRemoved.length,
    unchangedCount: allUnchanged.length,
    modifiedCount: allModified.length,
    vectorMissingCount: doc1Raw.length - doc1Chunks.length + doc2Raw.length - doc2Chunks.length,
    llmEnhancedCount: llmEnhancedCount,
    averageConfidence: settings.computeConfidence 
      ? [...added, ...allRemoved, ...allUnchanged, ...allModified]
          .reduce((sum, chunk) => sum + (chunk.confidence || 0), 0) / 
          (added.length + allRemoved.length + allUnchanged.length + allModified.length)
      : undefined
  };

  const endTime = Date.now();
  const duration = endTime - startTime;
  
  pipelineSteps.push(`Finalisation optimisée (${duration}ms)`);
  
  console.log(`[Compare Optimisé] Durée: ${duration}ms | Ajoutés: ${stats.addedCount}, Supprimés: ${stats.removedCount}, Modifiés: ${stats.modifiedCount}, Inchangés: ${stats.unchangedCount}`);
  
  // Nettoyage du cache si nécessaire (éviter les fuites mémoire)
  if (globalCache.vector.size > 10000) {
    globalCache.vector.clear();
    console.log('[Cache] Nettoyage du cache vectoriel');
  }
  
  if (globalCache.lexical.size > 5000) {
    globalCache.lexical.clear();
    globalCache.tokenized.clear();
    console.log('[Cache] Nettoyage du cache lexical');
  }

  return {
    added: added.sort((a, b) => a.chunkIndex - b.chunkIndex),
    removed: allRemoved.sort((a, b) => a.chunkIndex - b.chunkIndex),
    unchanged: allUnchanged.sort((a, b) => a.chunkIndex - b.chunkIndex),
    modified: allModified.sort((a, b) => a.chunkIndex - b.chunkIndex),
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
 * Récupère les détails des chunks pour un document spécifique (optimisé)
 */
export async function getChunkComparisonDetails(processingId: string): Promise<AstraChunk[]> {
  await ensureCollection();
  const collection = getCollection();

  const findOptions = { 
    projection: { 
      "$vector": 1 as const, 
      "text": 1 as const, 
      "metadata": 1 as const 
    } 
  };
  
  const rawDocs = await collection
    .find({ 'metadata.processingId': processingId }, findOptions)
    .toArray();

  return rawDocs
    .map(convertToAstraChunk)
    .filter((chunk): chunk is AstraChunk => chunk !== null);
}