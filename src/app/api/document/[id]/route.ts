import { NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument } from '@/services/documentService';

export async function GET({ params }: { params: { id: string } }) {
  try {
    const document = await getDocumentById(params.id);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}

export async function PUT({ params, request }: { params: { id: string }, request: Request }) {
  const data = await request.json();
  
  try {
    const updatedDocument = await updateDocument(params.id, data);
    return NextResponse.json(updatedDocument);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE({ params }: { params: { id: string } }) {
  try {
    await deleteDocument(params.id);
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
