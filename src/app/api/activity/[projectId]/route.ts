import { NextRequest, NextResponse } from 'next/server';
import * as activityService from '@/services/activityService';
import { requireProjectRole } from '@/lib/requireProjectRole';
import { Role } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Only allow users who are at least EMPLOYEE on the project
    await requireProjectRole(req, params.projectId, [
      Role.EMPLOYEE,
      Role.MANAGER,
      Role.ADMIN,
    ]);

    const activities = await activityService.getProjectActivities(params.projectId);
    return NextResponse.json({ activities });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
  }
}
