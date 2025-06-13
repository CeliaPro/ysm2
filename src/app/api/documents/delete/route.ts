import { NextRequest, NextResponse } from 'next/server';
import { withAuthentication } from '@/app/utils/auth.utils';
import { prisma } from '@/lib/prisma';
import { getCollection } from '@/lib/astra/client';

async function deleteDocumentChunks(
  collection: ReturnType<typeof getCollection>,
  processingId: string
): Promise<void> {
  try {
    const query = { "metadata.processingId": processingId };
    const findResult = await collection.find(query).toArray();

    if (findResult.length === 0) {
      console.log(`Aucun chunk trouvé pour le processingId: ${processingId}`);
      return;
    }
    console.log(`Suppression de ${findResult.length} chunks pour le processingId: ${processingId}`);
    await collection.deleteMany(query);
    console.log('Tous les chunks du document ont été supprimés avec succès');
  } catch (error) {
    console.error('Erreur lors de la suppression des chunks dans AstraDB:', error);
    throw error;
  }
}

export const DELETE = withAuthentication(async (request: NextRequest, user) => {
  try {
    const data = await request.json();
    const { documentId, processingId, conversationId } = data;

    if (!documentId || !processingId) {
      return NextResponse.json(
        { success: false, error: 'Les paramètres documentId et processingId sont requis.' },
        { status: 400 }
      );
    }

    // Vérifier que la conversation existe et appartient à l'utilisateur
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation non trouvée.' },
        { status: 404 }
      );
    }
    if (conversation.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé à supprimer ce document dans cette conversation.' },
        { status: 403 }
      );
    }

    // Supprimer les chunks du document dans AstraDB
    const collection = getCollection();
    await deleteDocumentChunks(collection, processingId);

    // Supprimer tous les messages système liés à ce document dans la conversation
    await prisma.message.deleteMany({
      where: {
        conversationId,
        role: 'SYSTEM',
        metadata: {
          path: ['processingId'],
          equals: processingId
        }
      }
    });

    // Optionnel : supprimer le document de la table Document si besoin
    // await prisma.document.deleteMany({
    //   where: { id: documentId }
    // });

    return NextResponse.json({
      success: true,
      message: 'Document supprimé avec succès.',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du document.' },
      { status: 500 }
    );
  }
}, 'EMPLOYEE');
