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
    case 'GET':
      // Get documents for the project
      try {
        const documents = await projectService.getProjectDocuments(projectId);
        return NextResponse.json(documents, { status: 200 });
      } catch (error: unknown) {
        if (error instanceof Error) {
          return NextResponse.json({ message: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }

    case 'POST':
      // Add a new document to the project
      try {
        const data = await req.json();
        // Assuming the document object has URL, name, and type
        const document = await projectService.addProjectDocument(projectId, user.userId, data);
        return NextResponse.json(document, { status: 201 });
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
