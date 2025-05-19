// lib/actions/messages.ts
import { prisma } from '@/lib/prisma';
import type { ChatRole, Conversation, Message as PrismaMessage } from '@prisma/client';
import { MessageMetadata } from '@/types/index';

/**
 * Crée un nouveau message (utilisateur ou assistant) dans la base.
 */

async function withPrisma<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } finally {
    await prisma.$disconnect();
  }
}

export async function createMessage(params: {
  conversationId: string;
  userId?: string;          // null pour l’IA
  role: ChatRole;           // USER | ASSISTANT
  content: string;
  metadata?: MessageMetadata; // JSON.stringify({})
}): Promise<PrismaMessage> {
  return withPrisma(async () => {
    return await prisma.message.create({
      data: {
        conversationId: params.conversationId,
        userId: params.userId,
        role: params.role,
        content: params.content,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    });
  });
}


/**
 * Récupère les derniers messages d'une conversation (mémoire courte).
 */
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

/**
 * Ajoute un feedback (like/dislike) sur un message existant.
 */
export async function setMessageFeedback(
  messageId: string,
  liked: boolean
): Promise<PrismaMessage> {
  return await prisma.message.update({
    where: { id: messageId },
    data: { liked, disliked: !liked },
  });
}

/**
 * Met à jour le résumé d'une conversation (mémoire longue).
 */
export async function updateConversationSummary(
  conversationId: string,
  summary: string
): Promise<Conversation> {
  return await prisma.conversation.update({
    where: { id: conversationId },
    data: { summary },
  });
}

/**
 * Récupère le résumé actuel d'une conversation.
 */
export async function getConversationSummary(
  conversationId: string
): Promise<string | null> {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { summary: true },
  });
  return conv?.summary ?? null;
}