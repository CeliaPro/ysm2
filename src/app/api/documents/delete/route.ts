import { NextRequest, NextResponse } from 'next/server';
import { withAuthentication } from '@/app/utils/auth.utils';
import { prisma } from '@/lib/prisma';
import { getCollection } from '@/lib/astra/client';
// Optional: import { logActivity } from '@/app/utils/logActivity';

async function deleteDocumentChunks(collection: ReturnType<typeof getCollection>, processingId: string): Promise<void> {
  try {
    const query = { "metadata.processingId": processingId };
    const findResult = await collection.find(query).toArray();

    if (findResult.length === 0) {
      console.log(`No chunks found for processingId: ${processingId}`);
      return;
    }
    console.log(`Deleting ${findResult.length} chunks for processingId: ${processingId}`);
    await collection.deleteMany(query);
    console.log(`All chunks deleted successfully.`);
  } catch (error) {
    console.error('Error deleting chunks in AstraDB:', error);
    throw error;
  }
}

export const DELETE = withAuthentication(async (request: NextRequest, user) => {
  try {
    const data = await request.json();
    const { documentId, processingId, conversationId } = data;

    if (!documentId || !processingId) {
      return NextResponse.json(
        { success: false, error: 'documentId and processingId are required' },
        { status: 400 }
      );
    }

    // 1. Verify conversation exists and belongs to user
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }
    if (conversation.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete document in this conversation' },
        { status: 403 }
      );
    }

    // 2. Delete document chunks from AstraDB
    const collection = getCollection();
    await deleteDocumentChunks(collection, processingId);

    // 3. Delete all system messages for this document in this conversation
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

    // 4. Optionally: Remove the document row from your Document table if needed (uncomment if you use Document model)
    // await prisma.document.deleteMany({
    //   where: { id: documentId }
    // });

    // Optionally log activity
    // await logActivity({
    //   userId: user.id,
    //   action: "DELETE_DOCUMENT",
    //   status: "SUCCESS",
    //   description: `Deleted document ${documentId} (processingId: ${processingId}) from conversation ${conversationId}`,
    //   req: request,
    // });

    return NextResponse.json({
      success: true,
      message: 'Document and its data deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Error deleting document' },
      { status: 500 }
    );
  }
}, 'EMPLOYEE');
