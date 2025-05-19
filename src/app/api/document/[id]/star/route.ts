import { NextResponse } from 'next/server';
import { starDocument, unstarDocument } from '@/services/documentService';

export async function POST({ params }: { params: { id: string } }) {
  try {
    await starDocument(params.id);
    return NextResponse.json({ message: 'Document starred successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to star document' }, { status: 500 });
  }
}

export async function DELETE({ params }: { params: { id: string } }) {
  try {
    await unstarDocument(params.id);
    return NextResponse.json({ message: 'Document unstarred successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unstar document' }, { status: 500 });
  }
}
