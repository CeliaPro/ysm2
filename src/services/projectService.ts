import { prisma } from '@/lib/prisma';

export const projectService = {
  // Create a new project
  createProject: async (userId: string, data: any) => {
    return prisma.project.create({
      data: {
        ...data,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });
  },

  // Get all projects the user is a member of
  getAllProjects: async (userId: string) => {
    return prisma.project.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
    });
  },

  // Get a project by its ID
  getProjectById: async (id: string) => {
    return prisma.project.findUnique({ where: { id } });
  },

  // Update a project by its ID
  updateProject: async (id: string, data: any) => {
    return prisma.project.update({ where: { id }, data });
  },

  // Delete a project by its ID
  deleteProject: async (id: string) => {
    return prisma.project.delete({ where: { id } });
  },

  // Archive a project
  archiveProject: async (id: string) => {
    return prisma.project.update({ where: { id }, data: { archived: true } });
  },

  // Unarchive a project
  unarchiveProject: async (id: string) => {
    return prisma.project.update({ where: { id }, data: { archived: false } });
  },

  // Get all members of a project
  getProjectMembers: async (projectId: string) => {
    return prisma.projectMember.findMany({ where: { projectId } });
  },

  // Add a member to a project
  addProjectMember: async (data: any) => {
    return prisma.projectMember.create({ data });
  },

  // Remove a member from a project
  removeProjectMember: async (userId: string, projectId: string) => {
    return prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });
  },

  // Get all documents associated with a project
  getProjectDocuments: async (projectId: string) => {
    return prisma.document.findMany({
      where: {
        projectId,
        isDeleted: false,  // Assuming you want to exclude deleted documents
      },
    });
  },

  // Add a document to the project
  addProjectDocument: async (projectId: string, userId: string, document: any) => {
    return prisma.document.create({
      data: {
        projectId,
        userId,  // You can use userId to track who added the document
        name: document.name,  // Assuming 'name' is part of the document data
        url: document.url,    // Assuming 'url' is part of the document data
        size: document.size,  // Assuming 'size' is part of the document data
        type: document.type,  // e.g., PDF, DOCX, etc.
      },
    });
  },

  // Get project storage usage details (if applicable)
  getProjectStorage: async (projectId: string) => {
    return prisma.storageUsage.findMany({ where: { projectId } });
  },
};
