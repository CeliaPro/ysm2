// services/userService.ts
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const register = async (data: any) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });
};

export const login = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const getCurrentUser = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const getAllUsers = async (currentUserId: string) => {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });
  
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
      throw new Error('Access denied: insufficient permissions');
    }
  
    return prisma.user.findMany();
  };

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const updateUser = async (id: string, data: any) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

export const deleteUser = async (id: string) => {
  return prisma.user.delete({
    where: { id },
  });
};

export const changeUserStatus = async (id: string, isActive: boolean) => {
  return prisma.user.update({
    where: { id },
    data: { isActive },
  });
};

export const getUserProjects = async (userId: string) => {
  return prisma.project.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
  });
};

export const assignUserToProject = async (userId: string, projectId: string, role: string) => {
  return prisma.projectMember.create({
    data: {
      userId,
      projectId,
      role,
    },
  });
};
export const verifyPassword = async (inputPassword: string, hashedPassword: string) => {
    return bcrypt.compare(inputPassword, hashedPassword);
  };