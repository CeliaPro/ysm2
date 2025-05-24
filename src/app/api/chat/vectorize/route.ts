// app/api/pdf/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { withAuthentication } from '@/app/utils/auth.utils'; // Adjust path if needed

export const config = {
  api: { bodyParser: false },
};

export const POST = withAuthentication(async (req: NextRequest, user) => {
  // Dynamically import to defer any env-based errors until runtime
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

    // Prepare metadata
    const metadata = {
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id,
      conversationId,
      processingId: randomUUID(),
    };

    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    const tempFileName = `${Date.now()}-${metadata.processingId}-${file.name}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    try {
      // Write to temp file
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(tempFilePath, buffer);

      // Upload & embed document
      await uploadDocumentFile({
        filePath: tempFilePath,
        fileName: file.name,
        userId: user.id,
        conversationId,
        metadata,
      });

      // Return success and metadata
      return NextResponse.json({ success: true, metadata });
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
