export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { uploadDocumentFile } from '@/lib/astra/upload';
import { randomUUID } from 'crypto';
import { withAuthentication } from '@/app/utils/auth.utils'; // Adjust path if needed

export const config = {
  api: { bodyParser: false },
};

export const POST = withAuthentication(async (req: NextRequest, user) => {
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

    // Metadata for file
    const metadata = {
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id,
      conversationId,
      processingId: randomUUID(),
    };

    await fs.mkdir(tempDir, { recursive: true });

    const tempFileName = `${Date.now()}-${metadata.processingId}-${file.name}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(tempFilePath, buffer);

      await uploadDocumentFile({
        filePath: tempFilePath,
        fileName: file.name,
        userId: user.id,
        conversationId,
        metadata,
      });

      return NextResponse.json({
        success: true,
        metadata,
      });
    } catch (error) {
      console.error('File processing error:', error);
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'File processing failed',
        },
        { status: 500 }
      );
    } finally {
      try {
        await fs.unlink(tempFilePath);
      } catch (e) {
        console.error('Failed to delete temp file:', e);
      }
    }
  } catch (err) {
    console.error('Vectorization error:', err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}, 'EMPLOYEE'); // Or 'MANAGER' / 'ADMIN' if needed
