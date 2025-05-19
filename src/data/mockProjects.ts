import { Project } from '@/types/project'

// Mock data
export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Finance Portal',
    description:
      'Financial documents, reports, and analysis for the finance department.',
    documentsCount: 24,
    membersCount: 8,
    storageUsed: '120 MB',
    storageLimit: '1 GB',
    usagePercentage: 12,
    createdAt: new Date(2023, 5, 15),
    lastUpdated: new Date(2023, 11, 15),
  },
  {
    id: '2',
    name: 'Product Development',
    description:
      'Roadmaps, specifications, and research for product development.',
    documentsCount: 18,
    membersCount: 12,
    storageUsed: '85 MB',
    storageLimit: '1 GB',
    usagePercentage: 8.5,
    createdAt: new Date(2023, 3, 20),
    lastUpdated: new Date(2023, 11, 10),
  },
  {
    id: '3',
    name: 'Marketing',
    description:
      'Campaign analysis, marketing materials, and performance reports.',
    documentsCount: 32,
    membersCount: 6,
    storageUsed: '167 MB',
    storageLimit: '1 GB',
    usagePercentage: 16.7,
    createdAt: new Date(2023, 2, 10),
    lastUpdated: new Date(2023, 11, 5),
  },
  {
    id: '4',
    name: 'HR Policies',
    description: 'Employee handbooks, policies, and procedures.',
    documentsCount: 12,
    membersCount: 4,
    storageUsed: '45 MB',
    storageLimit: '1 GB',
    usagePercentage: 4.5,
    createdAt: new Date(2023, 1, 5),
    lastUpdated: new Date(2023, 10, 25),
    isArchived: true,
  },
]
