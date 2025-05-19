import { projectService } from '@/services/projectService';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/getUserFromRequest'; // Ensure this path is correct

export async function handler(req: NextRequest, { params }: { params: { id: string; userid: string } }) {
  const { method } = req;
  const projectId = params.id;
  const userIdToRemove = params.userid;

  let user;
  try {
    user = await getUserFromRequest(req);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Unauthorized: ' + error.message }, { status: 401 });
    }
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  switch (method) {
    case 'DELETE':
      // Remove a member from the project
      try {
        const memberRemoved = await projectService.removeProjectMember(userIdToRemove, projectId);
        return NextResponse.json(memberRemoved, { status: 200 });
      } catch (error: unknown) {
        if (error instanceof Error) {
          return NextResponse.json({ message: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }

    default:
      return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
  }
}
