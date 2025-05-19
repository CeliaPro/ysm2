// services/activityService.ts
import { prisma } from '@/lib/prisma';

export const logActivity = async (data: any) => {
  return prisma.activityLog.create({ data });
};

export const getProjectActivities = async (projectId: string) => {
  return prisma.activityLog.findMany({ where: { projectId } });
};

export const getUserActivities = async (userId: string) => {
  return prisma.activityLog.findMany({ where: { userId } });
};

export const getDocumentActivities = async (documentId: string) => {
  return prisma.activityLog.findMany({ where: { documentId } });
};

export const getRecentActivities = async () => {
  return prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
};
