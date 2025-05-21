import { prisma } from '@/lib/prisma';
 import { ChatRole, Prisma } from '@prisma/client';
 import { MessageMetadata, SafeMetadata } from '@/types';
  import { withPrisma } from '@/lib/utils/withPrisma';


 export async function createConversation({ 
   userId, 
   title 
 }: { 
   userId: string; 
   title?: string 
 }) {
   return withPrisma(async () => {
     try {
       return await prisma.conversation.create({
         data: {
           userId,
           title: title || 'Nouvelle conversation',
         },
       });
     } catch (error) {
       console.error('Error creating conversation:', error);
       if (error instanceof Prisma.PrismaClientKnownRequestError) {
         throw new Error(`Database error: ${error.message}`);
       }
       throw error;
     }
   });
 }
 
 export async function addMessageToConversation({
   conversationId,
   userId,
   content,
   role,
   metadata,
 }: {
   conversationId: string;
   userId?: string;
   content: string;
   role: ChatRole;
   metadata?: MessageMetadata;
 }) {
   return withPrisma(async () => {
     try {
       if (userId) {
         const userExists = await prisma.user.findUnique({
           where: { id: userId },
         });
 
         if (!userExists) {
           throw new Error(`L'utilisateur avec l'ID ${userId} n'existe pas.`);
         }
       }
 
       const safeMetadata: SafeMetadata = metadata ? JSON.parse(JSON.stringify(metadata)) : undefined;
 
 
       return await prisma.message.create({
         data: {
           conversationId,
           userId,
           content,
           role,
           metadata: safeMetadata,
         },
       });
     } catch (error) {
       console.error('Error adding message:', error);
       throw error;
     }
   });
 }
 
 export async function getUserConversations(userId: string) {
  return withPrisma(async () => {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      userId: conv.userId,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messages: conv.messages.map(msg => ({
        id: msg.id,
        role: msg.role as "USER" | "ASSISTANT",
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        metadata: msg.metadata ?? undefined,
      }))
    }));
  });
}

export async function deleteConversation(conversationId: string, userId: string) {
  return withPrisma(async () => {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    return await prisma.conversation.delete({
      where: { id: conversationId },
    });
  });
}

 
 export async function renameConversation(conversationId: string, newTitle: string) {
   return withPrisma(async () => {
     try {
       const updatedConversation = await prisma.conversation.update({
         where: { id: conversationId },
         data: { title: newTitle },
       });
       return updatedConversation;
     } catch (error) {
       console.error('Error renaming conversation:', error);
       throw error;
     }
   });
 }