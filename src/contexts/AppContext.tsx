'use client';

import { createContext, useEffect, useContext, useState, ReactNode, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import jwt from 'jsonwebtoken';

// --------- Types ---------
interface Message {
  id?: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp?: number;
  createdAt?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface JwtUser {
  userId: number;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'EMPLOYEE';
}

interface AppContextType {
  user: JwtUser | null;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  selectedConversation: Conversation | null;
  setSelectedConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  fetchUsersConversations: () => Promise<void>;
  createNewConversation: () => Promise<Conversation | null>;
  isLoading: boolean;
}

// --------- Context & Hook ---------
export const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return ctx;
};

// --------- Helper ---------
const getUserFromToken = (): JwtUser | null => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const decoded: any = jwt.decode(token);
    if (!decoded?.userId || !decoded?.role) return null;

    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
};

// --------- Provider ---------
interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [user, setUser] = useState<JwtUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --------- Token Helper ---------
  const getToken = () => localStorage.getItem('token');

  const createNewConversation = useCallback(async (): Promise<Conversation | null> => {
    try {
      if (!user) {
        toast.error('Please login to create a conversation');
        return null;
      }

      const token = getToken();
      if (!token) {
        toast.error('Authentication failed');
        return null;
      }

      const response = await axios.post<ApiResponse<Conversation>>(
        '/api/chat/create',
        {
          title: `Chat ${new Date().toLocaleString()}`
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.data) {
        const newConversation = {
          ...response.data.data,
          messages: (response.data.data.messages || []).sort((a, b) =>
            new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
          )
        };
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
        return newConversation;
      }

      throw new Error(response.data.message || 'Failed to create conversation');
    } catch (error) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : 'Error creating conversation';
      console.error('Error creating conversation:', error);
      toast.error(errorMessage);
      return null;
    }
  }, [user]);

  const fetchUsersConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!user) return;

      const token = getToken();
      if (!token) {
        toast.error('Authentication failed');
        return;
      }

      const axiosInstance = axios.create({
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      const fetchWithRetry = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await axiosInstance.get<ApiResponse<Conversation[]>>('/api/chat/get');
            return response;
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      };

      const { data } = await fetchWithRetry();

      if (data.success && data.data) {
        const sorted = data.data.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ).map(conv => ({
          ...conv,
          messages: conv.messages?.sort((a, b) =>
            new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
          ) || []
        }));

        setConversations(sorted);
        if (sorted.length === 0) {
          const newConversation = await createNewConversation();
          if (newConversation) setSelectedConversation(newConversation);
        } else {
          setSelectedConversation(sorted[0]);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch conversations');
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'An unexpected error occurred';
      toast.error(`Failed to load conversations: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, createNewConversation]);

  useEffect(() => {
    const tokenUser = getUserFromToken();
    setUser(tokenUser);

    if (tokenUser) {
      void fetchUsersConversations();
    } else {
      setConversations([]);
      setSelectedConversation(null);
    }
  }, [fetchUsersConversations]);

  const value: AppContextType = {
    user,
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    fetchUsersConversations,
    createNewConversation,
    isLoading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
