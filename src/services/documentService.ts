// services/documentService.ts
import { prisma } from '@/lib/prisma';

export const uploadDocument = async (data: any) => {
  return prisma.document.create({ data });
};

export const getAllDocuments = async () => {
  return prisma.document.findMany();
};

export const getDocumentById = async (id: string) => {
  return prisma.document.findUnique({ where: { id } });
};

export const getProjectDocuments = async (projectId: string) => {
  return prisma.document.findMany({ where: { projectId } });
};

export const updateDocument = async (id: string, data: any) => {
  return prisma.document.update({ where: { id }, data });
};

export const deleteDocument = async (id: string) => {
  return prisma.document.delete({ where: { id } });
};

export const archiveDocument = async (id: string) => {
  return prisma.document.update({ where: { id }, data: { isArchived: true } });
};

export const unarchiveDocument = async (id: string) => {
  return prisma.document.update({ where: { id }, data: { isArchived: false } });
};

export const starDocument = async (id: string) => {
  return prisma.document.update({ where: { id }, data: { isStarred: true } });
};

export const unstarDocument = async (id: string) => {
  return prisma.document.update({ where: { id }, data: { isStarred: false } });
};

export const getDocumentTags = async () => {
  return prisma.documentTag.findMany();
};

export const addDocumentTag = async (data: any) => {
  return prisma.documentTag.create({ data });
};

export const removeDocumentTag = async (id: string) => {
  return prisma.documentTag.delete({ where: { id } });
};

export const downloadDocument = async (id: string) => {
  const doc = await prisma.document.findUnique({ where: { id } });
  return doc?.url || null;
};