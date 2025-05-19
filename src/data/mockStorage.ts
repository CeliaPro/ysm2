import { S3Bucket, StoragePolicy, StorageAccessLog } from '@/types/project'

// Mock S3 buckets
export const mockS3Buckets: S3Bucket[] = [
  {
    id: '1',
    bucketName: 'company-documents-prod',
    region: 'us-east-1',
    isActive: true,
    description: 'Production bucket for company documents',
    createdAt: new Date(2023, 5, 15),
    updatedAt: new Date(2023, 5, 15),
  },
  {
    id: '2',
    bucketName: 'company-documents-dev',
    region: 'us-east-1',
    isActive: true,
    description: 'Development bucket for testing',
    createdAt: new Date(2023, 5, 16),
    updatedAt: new Date(2023, 5, 16),
  },
]

// Mock storage policies
export const mockStoragePolicies: StoragePolicy[] = [
  {
    id: '1',
    projectId: '1',
    maxFileSize: 25 * 1024 * 1024, // 25 MB
    allowedFileTypes: ['pdf', 'docx', 'xlsx', 'pptx', 'txt'],
    retentionPeriod: 365, // 1 year
    createdAt: new Date(2023, 5, 15),
    updatedAt: new Date(2023, 5, 15),
  },
  {
    id: '2',
    projectId: '2',
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    allowedFileTypes: [
      'pdf',
      'docx',
      'xlsx',
      'pptx',
      'txt',
      'png',
      'jpg',
      'jpeg',
    ],
    retentionPeriod: 180, // 6 months
    createdAt: new Date(2023, 5, 16),
    updatedAt: new Date(2023, 5, 16),
  },
  {
    id: '3',
    projectId: '3',
    maxFileSize: 100 * 1024 * 1024, // 100 MB
    allowedFileTypes: [
      'pdf',
      'docx',
      'xlsx',
      'pptx',
      'txt',
      'png',
      'jpg',
      'jpeg',
      'svg',
      'ai',
      'psd',
    ],
    retentionPeriod: null, // No retention period
    createdAt: new Date(2023, 5, 17),
    updatedAt: new Date(2023, 5, 17),
  },
]

// Mock storage access logs
export const mockStorageAccessLogs: StorageAccessLog[] = [
  {
    id: '1',
    documentId: '1',
    userId: '1',
    accessType: 'view',
    accessTimestamp: new Date(2023, 11, 15, 14, 30),
    ipAddress: '192.168.1.1',
    success: true,
  },
  {
    id: '2',
    documentId: '1',
    userId: '2',
    accessType: 'download',
    accessTimestamp: new Date(2023, 11, 15, 15, 45),
    ipAddress: '192.168.1.2',
    success: true,
  },
  {
    id: '3',
    documentId: '2',
    userId: '3',
    accessType: 'view',
    accessTimestamp: new Date(2023, 11, 14, 10, 15),
    ipAddress: '192.168.1.3',
    success: true,
  },
  {
    id: '4',
    documentId: '3',
    userId: '1',
    accessType: 'upload',
    accessTimestamp: new Date(2023, 11, 13, 9, 20),
    ipAddress: '192.168.1.1',
    success: true,
  },
  {
    id: '5',
    documentId: '4',
    userId: '3',
    accessType: 'view',
    accessTimestamp: new Date(2023, 11, 12, 16, 30),
    ipAddress: '192.168.1.3',
    success: false,
  },
]
