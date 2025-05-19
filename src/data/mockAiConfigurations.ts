import {
  AIConfiguration,
  AIPrompt,
  AIConversation,
  AIMessage,
} from '@/types/ai'

// Mock AI configurations
export const mockAIConfigurations: AIConfiguration[] = [
  {
    id: '1',
    name: 'Document Summarization',
    model: 'gpt-4o',
    maxTokens: 500,
    temperature: 0.7,
    createdBy: '1', // Admin user
    isActive: true,
    createdAt: new Date(2023, 10, 15),
    updatedAt: new Date(2023, 10, 15),
  },
  {
    id: '2',
    name: 'Content Generation',
    model: 'gpt-4o',
    maxTokens: 1000,
    temperature: 0.8,
    createdBy: '1', // Admin user
    isActive: true,
    createdAt: new Date(2023, 10, 16),
    updatedAt: new Date(2023, 10, 16),
  },
  {
    id: '3',
    name: 'Document Q&A',
    model: 'gpt-4o-mini',
    maxTokens: 400,
    temperature: 0.5,
    createdBy: '2', // Project manager
    isActive: true,
    createdAt: new Date(2023, 10, 17),
    updatedAt: new Date(2023, 10, 17),
  },
]

// Mock AI prompts
export const mockAIPrompts: AIPrompt[] = [
  {
    id: '1',
    configurationId: '1',
    promptText: 'Summarize the following document in 3-5 bullet points:',
    purpose: 'document_summary',
    createdBy: '1',
    createdAt: new Date(2023, 10, 15),
    updatedAt: new Date(2023, 10, 15),
  },
  {
    id: '2',
    configurationId: '2',
    promptText: 'Generate content for a blog post about the following topic:',
    purpose: 'content_generation',
    createdBy: '1',
    createdAt: new Date(2023, 10, 16),
    updatedAt: new Date(2023, 10, 16),
  },
  {
    id: '3',
    configurationId: '3',
    promptText: 'Answer the following question based on the provided document:',
    purpose: 'document_qa',
    createdBy: '2',
    createdAt: new Date(2023, 10, 17),
    updatedAt: new Date(2023, 10, 17),
  },
]

// Mock AI conversations
export const mockAIConversations: AIConversation[] = [
  {
    id: '1',
    userId: '1',
    projectId: '1',
    documentId: '1',
    title: 'Q4 Financial Report Summary',
    createdAt: new Date(2023, 11, 15),
    updatedAt: new Date(2023, 11, 15),
  },
  {
    id: '2',
    userId: '2',
    projectId: '2',
    documentId: '2',
    title: 'Product Roadmap Analysis',
    createdAt: new Date(2023, 11, 14),
    updatedAt: new Date(2023, 11, 14),
  },
]

// Mock AI messages
export const mockAIMessages: AIMessage[] = [
  {
    id: '1',
    conversationId: '1',
    role: 'user',
    content: 'Summarize the Q4 Financial Report',
    timestamp: new Date(2023, 11, 15, 14, 30),
    tokensUsed: 10,
  },
  {
    id: '2',
    conversationId: '1',
    role: 'assistant',
    content:
      'Here is a summary of the Q4 Financial Report:\n\n• Revenue increased by 15% compared to Q3\n• Operating expenses reduced by 5%\n• Net profit margin improved to 22%\n• Cash reserves reached $5M\n• Projected growth for next quarter is 10%',
    timestamp: new Date(2023, 11, 15, 14, 31),
    tokensUsed: 75,
  },
  {
    id: '3',
    conversationId: '2',
    role: 'user',
    content: 'What are the key milestones in the product roadmap?',
    timestamp: new Date(2023, 11, 14, 10, 15),
    tokensUsed: 12,
  },
  {
    id: '4',
    conversationId: '2',
    role: 'assistant',
    content:
      'The key milestones in the product roadmap are:\n\n1. Alpha release - January 2024\n2. Beta testing - March 2024\n3. Feature freeze - April 2024\n4. Public launch - June 2024\n5. First major update - September 2024',
    timestamp: new Date(2023, 11, 14, 10, 16),
    tokensUsed: 68,
  },
]
