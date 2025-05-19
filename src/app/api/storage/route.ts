import { NextResponse } from 'next/server';
import * as storageService from '@/services/storageService'; // Import storage service functions

// Get all storage buckets
export async function GET() {
  try {
    const buckets = await storageService.getAllBuckets(); // Fetch all storage buckets
    return NextResponse.json({ buckets });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
  }
}

// Create a new storage bucket
export async function POST(request: Request) {
  try {
    const data = await request.json(); // Extract data from request
    const bucket = await storageService.createBucket(data); // Create new storage bucket
    return NextResponse.json({ bucket });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
  }
}
