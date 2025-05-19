// src/app/api/storage/usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStorageUsage } from '@/services/storageService';

export async function handler(req: NextRequest) {
  if (req.method === 'GET') {
    try {
      const usage = await getStorageUsage();
      return NextResponse.json(usage, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
  }
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
