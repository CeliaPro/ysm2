'use client'

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'            // ← your auth

// ---------- Types ----------
interface Message {
  id?: string
  role: 'USER' | 'ASSISTANT'
  content: string
  timestamp?: number
  createdAt?: string
}

interface Conversation {
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

interface AppContextType {
  userId: string | null
  conversations: Conversation[]
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  selectedConversation: Conversation | null
  setSelectedConversation: React.Dispatch<
    React.SetStateAction<Conversation | null>
  >
  fetchUsersConversations: () => Promise<void>
  createNewConversation: () => Promise<Conversation | null>
  isLoading: boolean
}

// ---------- Context ----------
const AppContext = createContext<AppContextType | null>(null)

export const useAppContext = (): AppContextType => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

// ---------- Provider ----------
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()                       // ✅ your auth
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)

  // -------- create new chat ----------
  const createNewConversation = useCallback(
    async (): Promise<Conversation | null> => {
      try {
        if (!user) {
          toast('Please login to create a conversation')
          return null
        }

        const res = await fetch('/api/chat/create', {
          method: 'POST',
          credentials: 'include',                  // cookie auth
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Chat ${new Date().toLocaleString()}`,
          }),
        })

        const data: ApiResponse<Conversation> = await res.json()

        if (!res.ok || !data.success || !data.data) {
          throw new Error(data.message || 'Failed to create conversation')
        }

        const sortedMessages =
          data.data.messages?.sort(
            (a, b) =>
              new Date(a.createdAt || '').getTime() -
              new Date(b.createdAt || '').getTime()
          ) || []

        const newConv = { ...data.data, messages: sortedMessages }

        setConversations((prev) => [newConv, ...prev])
        setSelectedConversation(newConv)
        return newConv
      } catch (err) {
        console.error('createNewConversation error:', err)
        toast('Unable to create conversation')
        return null
      }
    },
    [user]
  )

  // -------- fetch all user chats ----------
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

      const sorted = data.data
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .map((c) => ({
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

  // initial load
  useEffect(() => {
    void fetchUsersConversations()
  }, [fetchUsersConversations])

  // clear state on logout
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
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
