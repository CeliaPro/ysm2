import { ChatRole } from '@prisma/client';
import { Prisma } from '@prisma/client';

// Message related types
export interface MessageMetadata {
  timestamp?: number;
  source?: string;
  context?: string;
  params?: Record<string, unknown>;
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