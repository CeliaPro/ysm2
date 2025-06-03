import { NextRequest, NextResponse } from 'next/server'
import { compareDocumentChunks, getChunkComparisonDetails, AdvancedCompareOptions } from '@/lib/astra/compareChunks'
import { withAuthentication } from '@/app/utils/auth.utils'
// Optional: import { logActivity } from '@/app/utils/logActivity'

/** Utility for parsing boolean query/body params */
function parseBooleanParam(value: boolean | string | null | undefined): boolean | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return undefined
}
/** Utility for parsing numeric params */
function parseNumberParam(value: number | string | null | undefined): number | undefined {
  if (value === undefined || value === null) return undefined
  const parsed = Number(value)
  return isNaN(parsed) ? undefined : parsed
}

// ---- POST: Compare two docs' vectors/chunks ----
export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
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
      maxLLMOps
    } = body

    if (!doc1ProcessingId || !doc2ProcessingId) {
      return NextResponse.json(
        { success: false, error: 'Both document processing IDs are required.' },
        { status: 400 }
      )
    }

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
    }

    console.log(`[API Compare] User ${user.email} comparing docs:`, doc1ProcessingId, doc2ProcessingId, { options })

    // Optional: logActivity({ userId: user.id, action: "COMPARE_DOCUMENTS", ... })

    const comparisonResult = await compareDocumentChunks(doc1ProcessingId, doc2ProcessingId, options)

    return NextResponse.json({
      success: true,
      comparison: comparisonResult,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: comparisonResult.pipeline.duration,
        usedLLM: comparisonResult.pipeline.usedLLM
      }
    })
  } catch (error) {
    console.error('Error comparing document chunks:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Internal error during document comparison'
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: (error as any)?.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}, 'EMPLOYEE')

// ---- GET: Get chunk details for one doc ----
export const GET = withAuthentication(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const processingId = searchParams.get('processingId')
    const format = searchParams.get('format') || 'default'

    if (!processingId) {
      return NextResponse.json(
        { success: false, error: "processingId query param is required" },
        { status: 400 }
      )
    }

    console.log(`[API GetChunks] User ${user.email} requesting chunks for doc:`, processingId)

    const chunkDetails = await getChunkComparisonDetails(processingId)

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
      })
    } else {
      return NextResponse.json({
        success: true,
        chunks: chunkDetails,
        total: chunkDetails.length,
        processingId,
        hasVectors: chunkDetails.every(chunk => !!chunk.$vector),
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error retrieving chunk details:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Internal error retrieving document chunks',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}, 'EMPLOYEE')
