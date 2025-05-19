import { NextResponse } from 'next/server';
import * as activityService from '@/services/activityService';

export async function GET() {
  try {
    const activities = await activityService.getRecentActivities();
    return NextResponse.json({ activities });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
  }
}
// This code defines an API route for fetching recent activities. It uses the Next.js API routes feature to handle GET requests and returns a JSON response with the activities or an error message.