// src/app/api/storage/policies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateStoragePolicy } from '@/services/storageService';

export async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  if (req.method === 'PUT') {
    try {
      const data = await req.json();
      const updatedPolicy = await updateStoragePolicy(params.id, data);
      return NextResponse.json(updatedPolicy, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
  }
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
