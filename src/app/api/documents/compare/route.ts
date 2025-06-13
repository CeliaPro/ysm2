// app/api/documents/compare/route.ts
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { compareDocumentChunks, getChunkComparisonDetails, AdvancedCompareOptions } from '@/lib/astra/compareChunks';
import { withAuthentication } from '@/app/utils/auth.utils';

// --- Utilities ---
function parseBooleanParam(value: boolean | string | null | undefined): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return undefined;
}
function parseNumberParam(value: number | string | null | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return isNaN(parsed) ? undefined : parsed;
}

// --- POST: Compare two documents (Secured) ---
export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const {
      doc1ProcessingId,
      doc2ProcessingId,
      semanticSimilarityThreshold,
      lexicalSimilarityThreshold,
      useLLM,
      llmConfidenceThreshold,
      enhanceModifiedChunks,
      computeConfidenceScores,
      useVectorSimilarity,
      useExactMatching,
      useLexicalSimilarity,
      maxLLMOps,
    } = body;

    // Input validation
    if (!doc1ProcessingId || !doc2ProcessingId) {
      return NextResponse.json(
        { success: false, error: 'Les deux identifiants de traitement des documents sont requis.' },
        { status: 400 }
      );
    }

    // Compose options for comparison
    const options: AdvancedCompareOptions = {
      semanticSimilarityThreshold: parseNumberParam(semanticSimilarityThreshold),
      lexicalSimilarityThreshold: parseNumberParam(lexicalSimilarityThreshold),
      useLLM: parseBooleanParam(useLLM),
      llmConfidenceThreshold: parseNumberParam(llmConfidenceThreshold),
      enhanceModifiedChunks: parseBooleanParam(enhanceModifiedChunks),
      computeConfidenceScores: parseBooleanParam(computeConfidenceScores),
      useVectorSimilarity: parseBooleanParam(useVectorSimilarity),
      useExactMatching: parseBooleanParam(useExactMatching),
      useLexicalSimilarity: parseBooleanParam(useLexicalSimilarity),
      maxLLMOps: parseNumberParam(maxLLMOps),
    };

    // Security Logging (audit)
    console.log(`[API Compare] User ${user.email} comparing:`, doc1ProcessingId, doc2ProcessingId, { options });

    // Document comparison logic
    const comparisonResult = await compareDocumentChunks(
      doc1ProcessingId,
      doc2ProcessingId,
      options
    );

    return NextResponse.json({
      success: true,
      comparison: comparisonResult,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: comparisonResult?.pipeline?.duration,
        usedLLM: comparisonResult?.pipeline?.usedLLM,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de la comparaison des documents:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erreur interne lors de la comparaison des documents';
    const errorCode =
      error instanceof Error && 'code' in error ? (error as { code: string }).code : 'INTERNAL_ERROR';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}, 'EMPLOYEE'); // Require 'EMPLOYEE' or higher role

// --- GET: Get chunk details for one document (Secured) ---
export const GET = withAuthentication(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const processingId = searchParams.get('processingId');
    const format = searchParams.get('format') || 'default';

    if (!processingId) {
      return NextResponse.json(
        { success: false, error: "Paramètre 'processingId' requis." },
        { status: 400 }
      );
    }

    // Security Logging (audit)
    console.log(`[API GetChunks] User ${user.email} requesting chunks for doc:`, processingId);

    const chunkDetails = await getChunkComparisonDetails(processingId);

    if (format === 'simple') {
      return NextResponse.json({
        success: true,
        chunks: chunkDetails.map(chunk => ({
          index: chunk.metadata.chunkIndex,
          text: chunk.text,
          pageNumber: chunk.metadata.pageNumber,
        })),
        total: chunkDetails.length,
        processingId,
      });
    } else {
      return NextResponse.json({
        success: true,
        chunks: chunkDetails,
        total: chunkDetails.length,
        processingId,
        hasVectors: chunkDetails.every(chunk => !!chunk.$vector),
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error('Erreur lors de la récupération des chunks:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erreur interne lors de la récupération des chunks',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}, 'EMPLOYEE'); // Require 'EMPLOYEE' or higher role
