import { projectService } from '@/services/projectService';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/getUserFromRequest'; // Ensure this path is correct

export async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  const { method } = req;
  const projectId = params.id; // The project ID from the URL

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
    case 'GET':
      // Get project by ID
      try {
        const project = await projectService.getProjectById(projectId);
        if (!project) {
          return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        }
        return NextResponse.json(project, { status: 200 });
      } catch (error: unknown) {
        if (error instanceof Error) {
          return NextResponse.json({ message: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }

    case 'PUT':
      // Update project by ID
      try {
        const data = await req.json();
        const project = await projectService.updateProject(projectId, data);
        return NextResponse.json(project, { status: 200 });
      } catch (error: unknown) {
        if (error instanceof Error) {
          return NextResponse.json({ message: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }

    case 'DELETE':
      // Delete project by ID
      try {
        const project = await projectService.deleteProject(projectId);
        return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 });
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
