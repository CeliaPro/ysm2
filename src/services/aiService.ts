
// services/aiService.ts
import { prisma } from '@/lib/prisma';

export const getConfigurations = async () => {
  return prisma.aiConfiguration.findMany();
};

export const createConfiguration = async (data: any) => {
  return prisma.aiConfiguration.create({ data });
};

export const updateConfiguration = async (id: string, data: any) => {
  return prisma.aiConfiguration.update({ where: { id }, data });
};

export const getPrompts = async () => {
  return prisma.aiPrompt.findMany();
};

export const createPrompt = async (data: any) => {
  return prisma.aiPrompt.create({ data });
};

export const getConversations = async (userId: string) => {
  return prisma.aiConversation.findMany({ where: { userId } });
};

export const getConversation = async (id: string) => {
  return prisma.aiConversation.findUnique({ where: { id } });
};

export const createConversation = async (data: any) => {
  return prisma.aiConversation.create({ data });
};

export const sendMessage = async (data: any) => {
  return prisma.aiMessage.create({ data });
};

export const analyzeDocument = async (docId: string) => {
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  return `Analyzing: ${doc?.title}`;
};