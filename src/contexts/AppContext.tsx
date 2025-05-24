// contexts/AppContext.tsx
'use client'

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

// -------------------- Types --------------------
export interface Message {
  id?: string
  role: 'USER' | 'ASSISTANT'
  content: string
  timestamp?: number
  createdAt?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  userId: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export interface AppContextType {
  userId: string | null
  conversations: Conversation[]
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  selectedConversation: Conversation | null
  setSelectedConversation: React.Dispatch<React.SetStateAction<Conversation | null>>
  fetchUsersConversations: () => Promise<void>
  createNewConversation: () => Promise<Conversation | null>
  appendMessage: (conversationId: string, message: Message) => void
  isLoading: boolean
}

// ------------------ Context --------------------
const AppContext = createContext<AppContextType | null>(null)

export const useAppContext = (): AppContextType => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

// --------------- Provider ---------------------
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)

  // -------- Append a message helper --------
  const appendMessage = useCallback(
    (conversationId: string, message: Message) => {
      // Update the selected conversation if it matches
      setSelectedConversation(prev =>
        prev && prev.id === conversationId
          ? { ...prev, messages: [...prev.messages, message] }
          : prev
      )
      // Update it in the conversation list
      setConversations(list =>
        list.map(c =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, message] }
            : c
        )
      )
    },
    [setSelectedConversation, setConversations]
  )

  // -------- Create a new chat ----------
  const createNewConversation = useCallback(
    async (): Promise<Conversation | null> => {
      if (!user) {
        toast('Please login to create a conversation')
        return null
      }
      try {
        setIsLoading(true)
        const res = await fetch('/api/chat/create', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Chat ${new Date().toLocaleString()}`,
          }),
        })
        const data: ApiResponse<Conversation> = await res.json()
        if (!res.ok || !data.success || !data.data) {
          throw new Error(data.message || 'Failed to create conversation')
        }
        // Sort messages chronologically
        const sortedMessages =
          data.data.messages?.sort(
            (a, b) =>
              new Date(a.createdAt || '').getTime() -
              new Date(b.createdAt || '').getTime()
          ) || []
        const newConv: Conversation = {
          ...data.data,
          messages: sortedMessages,
        }
        setConversations(prev => [newConv, ...prev])
        setSelectedConversation(newConv)
        return newConv
      } catch (err) {
        console.error('createNewConversation error:', err)
        toast('Unable to create conversation')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [user]
  )

  // -------- Fetch all user chats ----------
  const fetchUsersConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setSelectedConversation(null)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat/get', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const data: ApiResponse<Conversation[]> = await res.json()
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || 'Fetch failed')
      }
      // Sort conversations by updatedAt desc, messages by createdAt asc
      const sorted = data.data
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime()
        )
        .map(c => ({
          ...c,
          messages:
            c.messages?.sort(
              (a, b) =>
                new Date(a.createdAt || '').getTime() -
                new Date(b.createdAt || '').getTime()
            ) || [],
        }))
      setConversations(sorted)
      setSelectedConversation(sorted[0] || null)
    } catch (err) {
      console.error('fetchUsersConversations error:', err)
      toast('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Initial load
  useEffect(() => {
    void fetchUsersConversations()
  }, [fetchUsersConversations])

  // Clear on logout
  useEffect(() => {
    if (!user) {
      setConversations([])
      setSelectedConversation(null)
    }
  }, [user])

  return (
    <AppContext.Provider
      value={{
        userId: user?.id || null,
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
        fetchUsersConversations,
        createNewConversation,
        appendMessage,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
