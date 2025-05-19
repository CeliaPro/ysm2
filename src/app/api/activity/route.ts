import { NextRequest, NextResponse } from 'next/server';
import * as activityService from '@/services/activityService';

export async function GET(req: NextRequest) {
  try {
    const recent = await activityService.getRecentActivities();
    return NextResponse.json({ activities: recent });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // You can add validation here, for example:
    if (!data.activityType || !data.userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const activity = await activityService.logActivity(data);
    return NextResponse.json({ activity });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
  }
}
