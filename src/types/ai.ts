
export interface AIConfiguration {
  id: string;
  name: string;
  model: string;
  maxTokens: number;
  temperature: number;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIPrompt {
  id: string;
  configurationId: string;
  promptText: string;
  purpose: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  projectId: string | null;
  documentId: string | null;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokensUsed: number;
}
