// app/api/pdf/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { withAuthentication } from '@/app/utils/auth.utils';
import { prisma } from '@/lib/prisma'; // Required for duplicate check

export const config = {
  api: { bodyParser: false },
};

// Helper to check if doc already exists for conversation
async function checkDocumentExists({
  fileName,
  fileSize,
  fileType,
  conversationId,
}: {
  fileName: string;
  fileSize: number;
  fileType: string;
  conversationId: string;
}): Promise<boolean> {
  try {
    const existing = await prisma.message.findFirst({
      where: {
        conversationId,
        metadata: {
          path: ["event"],
          equals: "upload",
        },
        AND: [
          { metadata: { path: ["originalName"], equals: fileName } },
          { metadata: { path: ["fileSize"], equals: fileSize } },
          { metadata: { path: ["fileType"], equals: fileType } },
        ],
      },
    });
    return !!existing;
  } catch (err) {
    console.error("Duplicate check failed:", err);
    return false;
  }
}

export const POST = withAuthentication(async (req: NextRequest, user) => {
  const { uploadDocumentFile } = await import('@/lib/astra/upload');
  const tempDir = path.join(os.tmpdir(), 'document-uploads');

  try {
    const form = await req.formData();
    const file = form.get('file');
    const conversationId = form.get('conversationId')?.toString();

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No valid file provided' },
        { status: 400 }
      );
    }
    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Missing conversationId' },
        { status: 400 }
      );
    }

    // Metadata to be saved
    const metadata = {
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id,
      conversationId,
      processingId: randomUUID(),
    };

    // 1️⃣ Check if file with same name, size, type was already uploaded in this conversation
    const alreadyExists = await checkDocumentExists({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      conversationId,
    });

    if (alreadyExists) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: 'Document déjà présent, vectorisation ignorée',
        metadata,
      });
    }

    // 2️⃣ Ensure temp dir exists, write to temp file
    await fs.mkdir(tempDir, { recursive: true });
    const tempFileName = `${Date.now()}-${metadata.processingId}-${file.name}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(tempFilePath, buffer);

      // 3️⃣ Upload and vectorize
      const result = await uploadDocumentFile({
        filePath: tempFilePath,
        fileName: file.name,
        userId: user.id,
        conversationId,
        metadata,
      });

      // result can have stats from your uploadDocumentFile, like { chunks, uniqueChunks, reusedChunks }
      return NextResponse.json({
        success: true,
        alreadyExists: false,
        metadata,
        stats: result?.chunks ? {
          totalChunks: result.chunks,
          uniqueChunks: result.uniqueChunks,
          reusedChunks: result.reusedChunks,
        } : undefined,
      });
    } catch (error: any) {
      console.error('File processing error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'File processing failed' },
        { status: 500 }
      );
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFilePath);
      } catch (e) {
        console.error('Failed to delete temp file:', e);
      }
    }
  } catch (err: any) {
    console.error('PDF upload error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}, 'EMPLOYEE');
