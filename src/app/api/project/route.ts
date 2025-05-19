import { projectService } from '@/services/projectService';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/getUserFromRequest'; // Ensure this path is correct

export async function handler(req: NextRequest) {
  const { method } = req;
  let user;

  try {
    // Get the user data from the JWT token in the request
    user = await getUserFromRequest(req); // Ensure 'req' is of type NextRequest
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Unauthorized: ' + error.message }, { status: 401 });
    }
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  switch (method) {
    case 'GET':
      // Get all projects for the user
      try {
        const projects = await projectService.getAllProjects(user.userId); // Assuming `userId` is used for project queries
        return NextResponse.json(projects, { status: 200 });
      } catch (error: unknown) {
        if (error instanceof Error) {
          return NextResponse.json({ message: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }

    case 'POST':
      // Create a new project
      try {
        const data = await req.json(); // Parse JSON body
        const project = await projectService.createProject(user.userId, data); // Pass userId and project data
        return NextResponse.json(project, { status: 201 });
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
