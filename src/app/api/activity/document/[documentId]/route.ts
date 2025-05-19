import { NextResponse } from 'next/server';
import * as activityService from '@/services/activityService';

export async function GET({ params }: { params: { documentId: string } }) {
  try {
    const activities = await activityService.getDocumentActivities(params.documentId);
    return NextResponse.json({ activities });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
  }
}
