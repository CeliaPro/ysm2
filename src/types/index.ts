import { Prisma, ChatRole } from '@prisma/client'

// ---------- Metadata ----------
export interface MessageMetadata {
  timestamp?: number
  context?: string
  originalName?: string
  fileSize?: number
  fileType?: string
  uploadedAt?: string
  uploadedBy?: string
  processingId?: string
  [key: string]: unknown
}
export type SafeMetadata = Prisma.JsonValue

// ---------- Message ----------
export interface Message {
  role: ChatRole
  content: string
  timestamp: number
  metadata?: SafeMetadata
}

// ---------- Conversation ----------
export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  userId: string
}

// ---------- Generic API response ----------
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

// ---------- Payload for createMessage ----------
export interface MessageCreate {
  role: ChatRole
  content: string
  conversationId: string
  userId?: string             // ✅ optional (null allowed)
  metadata?: SafeMetadata     // ✅ consistent
}
