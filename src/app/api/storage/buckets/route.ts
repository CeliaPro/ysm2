// src/app/api/storage/buckets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createBucket } from '@/services/storageService';

export async function handler(req: NextRequest) {
  if (req.method === 'POST') {
    try {
      const data = await req.json();
      const bucket = await createBucket(data);
      return NextResponse.json(bucket, { status: 201 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
  }
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
