// lib/actions/messages.ts
import { prisma } from '@/lib/prisma';
import { ChatRole, Conversation, Message as PrismaMessage } from '@prisma/client';
import { MessageMetadata } from '@/types/index';

/**
 * Crée un nouveau message (utilisateur ou assistant) dans la base.
 */

export async function createMessage(params: {
  conversationId: string;
  userId?: string;
  role: ChatRole;
  content: string;
  metadata?: MessageMetadata;
}): Promise<PrismaMessage> {
  return prisma.message.create({
    data: {
      conversationId: params.conversationId,
      userId: params.userId ?? null,
      role: params.role,
      content: params.content,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    },
  });
}

export async function getRecentMessages(
  conversationId: string,
  limit = 10
): Promise<PrismaMessage[]> {
  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function setMessageFeedback(
  messageId: string,
  liked: boolean
): Promise<PrismaMessage> {
  return await prisma.message.update({
    where: { id: messageId },
    data: { liked, disliked: !liked },
  });
}

export async function updateConversationSummary(
  conversationId: string,
  summary: string
): Promise<Conversation> {
  return await prisma.conversation.update({
    where: { id: conversationId },
    data: { summary },
  });
}

export async function getConversationSummary(
  conversationId: string
): Promise<string | null> {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { summary: true },
  });
  return conv?.summary ?? null;
}

export async function getUploadedDocuments(conversationId: string) {
  return prisma.message.findMany({
    where: {
      conversationId,
      role: ChatRole.SYSTEM,
      metadata: {
        path: ["event"],
        equals: "upload",
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      content: true,
      metadata: true,
      createdAt: true,
    },
  });
}