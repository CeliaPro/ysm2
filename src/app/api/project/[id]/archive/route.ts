import { projectService } from '@/services/projectService';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/getUserFromRequest'; // Ensure this path is correct

export async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  const { method } = req;
  const projectId = params.id;

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
    case 'POST':
      // Archive the project
      try {
        const archivedProject = await projectService.archiveProject(projectId);
        return NextResponse.json(archivedProject, { status: 200 });
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
