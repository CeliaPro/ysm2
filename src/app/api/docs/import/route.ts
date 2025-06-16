// app/api/docs/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { uploadDocumentFile } from '@/lib/astra/upload'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const bucketName = 'ysm-ensam'
const s3 = new S3Client({ region: "us-east-1" })

export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { documentId, conversationId } = body

    if (!documentId || !conversationId) {
      return NextResponse.json(
        { success: false, error: 'Missing documentId or conversationId' },
        { status: 400 }
      )
    }

    // Fetch document record
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    })
    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    // Prepare correct S3 key
    let fileKey = doc.url;
    if (!fileKey.startsWith('docs/')) {
      fileKey = 'docs/' + fileKey;
    }

    // Download file buffer from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    })
    const fileObject = await s3.send(getObjectCommand)
    if (!fileObject.Body) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve file from S3 (Body is undefined)' },
        { status: 500 }
      )
    }
    const uint8Array = await fileObject.Body.transformToByteArray()
    const fileBuffer = Buffer.from(uint8Array)

    // Metadata (matches what you use for uploads)
    const metadata = {
      originalName: doc.name,
      fileSize: doc.size,
      fileType: doc.type,
      uploadedAt: doc.createdAt.toISOString(),
      uploadedBy: doc.userId,
      conversationId,
      processingId: documentId,
      imported: true,
      importedFromDocId: documentId,
    }

    // Vectorization logic (must support buffer)
    const result = await uploadDocumentFile({
      filePath: '', // Not needed if you support buffers, or adapt uploadDocumentFile
      fileName: doc.name,
      userId: user.id,
      conversationId,
      metadata,
    })

    return NextResponse.json({
      success: true,
      alreadyExists: false,
      metadata,
      stats: result?.chunks
        ? {
            totalChunks: result.chunks,
            uniqueChunks: result.uniqueChunks,
            reusedChunks: result.reusedChunks,
          }
        : undefined,
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}, 'EMPLOYEE')
