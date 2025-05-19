// src/app/api/storage/upload-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/services/storageService';

export async function handler(req: NextRequest) {
  if (req.method === 'POST') {
    try {
      const { fileKey } = await req.json();
      const presignedUrl = await generatePresignedUrl(fileKey);
      return NextResponse.json({ presignedUrl }, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
  }
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
