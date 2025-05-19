// services/storageService.ts
import { prisma } from '@/lib/prisma';

export const getAllBuckets = async () => {
  return prisma.storageBucket.findMany();
};

export const createBucket = async (data: any) => {
  return prisma.storageBucket.create({ data });
};

export const getStoragePolicy = async (projectId: string) => {
  return prisma.storagePolicy.findFirst({ where: { projectId } });
};

export const createStoragePolicy = async (data: any) => {
  return prisma.storagePolicy.create({ data });
};

export const updateStoragePolicy = async (id: string, data: any) => {
  return prisma.storagePolicy.update({ where: { id }, data });
};

export const getAccessLogs = async () => {
  return prisma.accessLog.findMany();
};

export const getStorageUsage = async () => {
  return prisma.storageUsage.findMany();
};

export const generatePresignedUrl = async (fileKey: string) => {
  // This typically involves AWS SDK, not Prisma
  return `https://your-s3-url/${fileKey}`;
};
