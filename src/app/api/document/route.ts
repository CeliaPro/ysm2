import { NextResponse } from 'next/server';
import { uploadDocument, getAllDocuments } from '@/services/documentService';

export async function GET() {
  try {
    const documents = await getAllDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const data = await request.json();
  
  try {
    const document = await uploadDocument(data);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
