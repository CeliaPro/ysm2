import { NextResponse } from 'next/server';
import { archiveDocument, unarchiveDocument } from '@/services/documentService';

export async function PATCH({ params, request }: { params: { id: string }, request: Request }) {
  const { action } = await request.json();
  
  try {
    if (action === 'archive') {
      await archiveDocument(params.id);
      return NextResponse.json({ message: 'Document archived successfully' });
    } else if (action === 'unarchive') {
      await unarchiveDocument(params.id);
      return NextResponse.json({ message: 'Document unarchived successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to change document status' }, { status: 500 });
  }
}
