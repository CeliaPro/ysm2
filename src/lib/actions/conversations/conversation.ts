import { prisma } from '@/lib/prisma';
 import { ChatRole, Prisma } from '@prisma/client';
 import { MessageMetadata, SafeMetadata } from '@/types/index';
 
 // Helper function to manage Prisma connections
 async function withPrisma<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Always disconnect first to ensure clean slate
      await prisma.$disconnect();
      
      // Wait a bit longer between each retry
      if (attempt > 0) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }

      // Create fresh connection
      await prisma.$connect();

      // Execute operation directly since we're not using the transaction context
      const result = await operation();
      return result;

    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, {
        error,
        timestamp: new Date().toISOString()
      });

      // Only retry on connection-related errors
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) ||
          !['P2015', '42P05', '40001'].includes(error.code || '')) {
        throw error;
      }
    } finally {
      // Always cleanup
      await prisma.$disconnect();
    }
  }

  throw lastError || new Error('All retry attempts failed');
}


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
     try {
       const conversations = await prisma.conversation.findMany({
         where: {
           userId: userId
         },
         include: {
           messages: true
         },
         orderBy: {
           updatedAt: 'desc'
         }
       });
 
       // Transform the data outside of the query
       return conversations.map(conv => ({
         id: conv.id,
         title: conv.title,
         messages: conv.messages.map(msg => ({
           id: msg.id,
           role: msg.role,
           content: msg.content,
           createdAt: msg.createdAt.toISOString(),
         })),
         createdAt: conv.createdAt.toISOString(),
         updatedAt: conv.updatedAt.toISOString(),
         userId: conv.userId
       }));
 
     } catch (error) {
       console.error('Error fetching conversations:', error);
       throw error;
     }
   });
 }
 
 export async function deleteConversation(conversationId: string, userId: string) {
   // Find the conversation and ensure the user owns it
   const conversation = await prisma.conversation.findUnique({
     where: { id: conversationId },
   });
 
   if (!conversation || conversation.userId !== userId) {
     throw new Error('Conversation not found or unauthorized');
   }
 
   // Delete the conversation
   return await prisma.conversation.delete({
     where: { id: conversationId },
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