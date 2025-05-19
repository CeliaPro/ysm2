// src/app/api/storage/acess-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAccessLogs } from '@/services/storageService';

export async function handler(req: NextRequest) {
  if (req.method === 'GET') {
    try {
      const logs = await getAccessLogs();
      return NextResponse.json(logs, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
  }
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
