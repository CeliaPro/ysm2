import { ChatRole } from '@prisma/client';
import { Prisma } from '@prisma/client';

// Message related types
export interface MessageMetadata {
  timestamp?: number;
  context?: string;
  originalName?: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  processingId?: string;
  [key: string]: unknown;
}
export type SafeMetadata = Prisma.JsonValue;

export interface Message {
  role: ChatRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Conversation related types
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface MessageCreate {
  role: ChatRole;
  content: string;
  conversationId: string;
  userId: string;
  metadata?: MessageMetadata;
}

export interface AstraDoc {
  _id: string;
  text: string;
  $vector?: number[];
  metadata: {
    source?: string;
    chunkIndex: number;
    userId?: string;
    conversationId?: string;
    createdAt: string;
    chunkHash?: string;
    processingId?: string;
    pageNumber?: number;
  };
}

export interface AstraChunk {
  _id: string;
  text: string;
  $vector: number[];
  metadata: {
    processingId: string;
    chunkIndex: number;
    chunkHash: string;
    pageNumber?: number;
  };
}

export interface ComparedChunk {
  chunkIndex: number;
  text: string;
  status: 'added' | 'removed' | 'unchanged' | 'modified';
  similarity?: number;
  confidence?: number;
  pageNumber?: number;
  llmAnalysis?: string;
  diffHighlight?: string;
}

export interface ComparisonResult {
  added: ComparedChunk[];
  removed: ComparedChunk[];
  unchanged: ComparedChunk[];
  modified: ComparedChunk[];
  statistics: {
    totalChunksDoc1: number;
    totalChunksDoc2: number;
    addedCount: number;
    removedCount: number;
    unchangedCount: number;
    modifiedCount: number;
    vectorMissingCount: number;
    llmEnhancedCount?: number;
    averageConfidence?: number;
  };
  comparedProcessingIds: {
    doc1: string;
    doc2: string;
  };
  pipeline: {
    steps: string[];
    duration: number;
    usedLLM: boolean;
  };
}