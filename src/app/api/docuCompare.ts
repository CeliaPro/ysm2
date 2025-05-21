// app/api/documents/compare/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCollection, ensureCollection } from '@/lib/astra/client';
import { withAuthentication } from '@/app/utils/auth.utils'; // Adjust path if needed

export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const { doc1ProcessingId, doc2ProcessingId } = body;

    if (!doc1ProcessingId || !doc2ProcessingId) {
      return NextResponse.json({
        error: 'Deux identifiants de traitement de document sont requis',
      }, { status: 400 });
    }

    await ensureCollection();
    const collection = getCollection();

    // Load chunks for both documents (no user filter yet)
    const [doc1Chunks, doc2Chunks] = await Promise.all([
      collection.find({ 'metadata.processingId': doc1ProcessingId }).toArray(),
      collection.find({ 'metadata.processingId': doc2ProcessingId }).toArray(),
    ]);

    if (!doc1Chunks.length || !doc2Chunks.length) {
      return NextResponse.json({
        error: 'Un ou plusieurs documents n\'ont pas été trouvés',
      }, { status: 404 });
    }

    // Optional: Check if the documents belong to the user
    const userOwnsDoc1 = doc1Chunks.every((chunk: any) => chunk.metadata.uploadedBy === user.id);
    const userOwnsDoc2 = doc2Chunks.every((chunk: any) => chunk.metadata.uploadedBy === user.id);

    if (!userOwnsDoc1 || !userOwnsDoc2) {
      return NextResponse.json({
        error: 'Vous n\'avez pas accès à l\'un des documents',
      }, { status: 403 });
    }

    // Mapping and comparison
    const doc1ChunksMap = new Map<string, { text: string; chunkIndex: number }>();
    const doc2ChunksMap = new Map<string, { text: string; chunkIndex: number }>();
    const doc1HashSet = new Set<string>();
    const doc2HashSet = new Set<string>();

    doc1Chunks.forEach((chunk: any) => {
      const hash = chunk.metadata.chunkHash;
      doc1ChunksMap.set(hash, {
        text: chunk.text,
        chunkIndex: chunk.metadata.chunkIndex,
      });
      doc1HashSet.add(hash);
    });

    doc2Chunks.forEach((chunk: any) => {
      const hash = chunk.metadata.chunkHash;
      doc2ChunksMap.set(hash, {
        text: chunk.text,
        chunkIndex: chunk.metadata.chunkIndex,
      });
      doc2HashSet.add(hash);
    });

    const added: { chunkIndex: number; text: string }[] = [];
    const removed: { chunkIndex: number; text: string }[] = [];
    const unchanged: { chunkIndex: number; text: string }[] = [];

    for (const hash of doc1HashSet) {
      if (doc2HashSet.has(hash)) {
        const chunk = doc1ChunksMap.get(hash)!;
        unchanged.push({ chunkIndex: chunk.chunkIndex, text: chunk.text });
      }
    }

    for (const hash of doc1HashSet) {
      if (!doc2HashSet.has(hash)) {
        const chunk = doc1ChunksMap.get(hash)!;
        removed.push({ chunkIndex: chunk.chunkIndex, text: chunk.text });
      }
    }

    for (const hash of doc2HashSet) {
      if (!doc1HashSet.has(hash)) {
        const chunk = doc2ChunksMap.get(hash)!;
        added.push({ chunkIndex: chunk.chunkIndex, text: chunk.text });
      }
    }

    added.sort((a, b) => a.chunkIndex - b.chunkIndex);
    removed.sort((a, b) => a.chunkIndex - b.chunkIndex);
    unchanged.sort((a, b) => a.chunkIndex - b.chunkIndex);

    console.log(`[Comparaison] ${doc1Chunks.length} chunks vs ${doc2Chunks.length} chunks`);
    console.log(`[Résultat] Ajoutés: ${added.length}, Supprimés: ${removed.length}, Inchangés: ${unchanged.length}`);

    return NextResponse.json({
      comparison: { added, removed, unchanged },
    });
  } catch (error) {
    console.error('Erreur lors de la comparaison des documents:', error);
    return NextResponse.json({
      error: 'Erreur interne lors de la comparaison des documents',
    }, { status: 500 });
  }
}, 'EMPLOYEE'); // Adjust role as needed
