// types/project.ts

// --------------- Project Status ---------------
export type ProjectStatus = 'ACTIF' | 'EN_ATTENTE' | 'TERMINE';

// --------------- Project ---------------
export interface Project {
  id: string;
  name: string;
  description: string | null;
  documentsCount?: number;
  membersCount?: number;
  storageUsed?: string;
  storageLimit?: string | null;
  usagePercentage?: number;
  createdAt: Date;
  updatedAt: Date;
  archived?: boolean;
  status: ProjectStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  tasks?: Task[];
}

// --------------- Project Member ---------------
export type ProjectRole = 'OWNER' | 'EDITOR' | 'VIEWER' | 'MANAGER';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: Date;
}

// --------------- Storage ---------------
export type StorageProvider = 'local' | 's3';
export type AccessLevel = 'public' | 'private' | 'project';

// --------------- Document ---------------
export interface Document {
  id: string;
  projectId: string;
  projectName?: string;
  name: string;
  description: string | null;
  filePath: string;
  fileSize: number;
  fileSizeFormatted?: string;
  fileType: string;
  uploadedById: string;
  uploadedBy?: string;
  uploadedAt: Date;
  updatedById?: string | null;
  updatedBy?: string;
  updatedAt: Date;
  isArchived: boolean;
  storageProvider?: StorageProvider;
  s3BucketName?: string | null;
  s3ObjectKey?: string | null;
  s3Region?: string | null;
  contentType: string;
  publicUrl: string | null;
  accessLevel?: AccessLevel;
  tags?: string[];
  isStarred?: boolean;
}

// --------------- Tag Document ---------------
export interface DocumentTag {
  id: string;
  documentId: string;
  tagName: string;
}

// --------------- S3 Bucket ---------------
export interface S3Bucket {
  id: string;
  bucketName: string;
  region: string;
  isActive: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// --------------- Storage Policy ---------------
export interface StoragePolicy {
  id: string;
  projectId: string;
  maxSizeMb: number;
  allowedTypes?: string;
  retentionDays?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// --------------- Storage Access Log ---------------
export interface StorageAccessLog {
  id: string;
  documentId: string;
  userId: string;
  accessType: 'view' | 'download' | 'upload' | 'delete';
  accessTimestamp: Date;
  ipAddress: string | null;
  success: boolean;
}

// --------------- Activity Log ---------------
export interface ActivityLog {
  id: string;
  userId: string;
  projectId: string | null;
  documentId: string | null;
  actionType: 'CRÉER' | 'MODIFIER' | 'SUPPRIMER' | 'ARCHIVER' | string;
  actionDetails: string | null;
  createdAt: Date;
}

// --------------- Task Enums (must match Prisma) ---------------
export type TaskStatus = 'A_FAIRE' | 'EN_COURS' | 'TERMINEE';
export type TaskSeverity = 'FAIBLE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';

// --------------- Task Dependency Type ---------------
export interface TaskDependency {
  id: string;
  title: string;
}

// --------------- Task (Gantt ready!) ---------------
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  assignee: string;
  status: TaskStatus;
  severity: TaskSeverity;
  startDate: Date;
  deadline: Date;
  endDate?: Date | null;
  createdAt: Date;
  projectId: string;
  // Gantt dependencies (many-to-many)
  dependencies?: TaskDependency[]; // Tasks this one depends on (arrows from)
  dependedBy?: TaskDependency[];   // Tasks that depend on this one (arrows to)
}

// --------------- Mapping objects for display ---------------
export const statusLabels: Record<TaskStatus, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
};

export const severityLabels: Record<TaskSeverity, string> = {
  FAIBLE: "Faible",
  MOYENNE: "Moyenne",
  HAUTE: "Haute",
  CRITIQUE: "Critique",
};
