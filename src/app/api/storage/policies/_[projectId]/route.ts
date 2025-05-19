// src/app/api/storage/policies/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStoragePolicy } from '@/services/storageService';

export async function handler(req: NextRequest, { params }: { params: { projectId: string } }) {
  if (req.method === 'GET') {
    try {
      const policy = await getStoragePolicy(params.projectId);
      return NextResponse.json(policy, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
  }
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
