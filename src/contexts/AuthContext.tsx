'use client'
import React, { createContext, useState, useContext, useEffect } from 'react'
import { toast } from 'sonner'

// Define types
export type UserRole = 'admin' | 'project_manager' | 'employee'
export type ProjectRole = 'owner' | 'editor' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  projects?: string[]
}

export interface ProjectMember {
  projectId: string
  userId: string
  role: ProjectRole
  joinedAt: Date
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  isAdmin: () => boolean
  isProjectManager: () => boolean
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'password',
    name: 'Admin User',
    role: 'admin' as UserRole,
    createdAt: new Date(2023, 5, 15),
    updatedAt: new Date(2023, 11, 15),
    projects: ['1', '2', '3'],
  },
  {
    id: '2',
    email: 'manager@example.com',
    password: 'password',
    name: 'Project Manager',
    role: 'project_manager' as UserRole,
    createdAt: new Date(2023, 5, 16),
    updatedAt: new Date(2023, 11, 14),
    projects: ['1', '2'],
  },
  {
    id: '3',
    email: 'employee@example.com',
    password: 'password',
    name: 'Employee User',
    role: 'employee' as UserRole,
    createdAt: new Date(2023, 5, 17),
    updatedAt: new Date(2023, 11, 13),
    projects: ['1'],
  },
]

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    setIsLoading(true)
    getUser()
    .catch(()=>{})
    .finally(()=>{
      setIsLoading(false)
    })
  }, [])

  const getUser = async() => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const login = async (email: string, password: string) => {
    try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
    
          if (response.ok) {
            toast.success('Connexion réussie'); //added
            await getUser()
          } else {
            const { message } = await response.json(); //added
            toast.error('Les mots de passe ne correspondent pas')
          }
        } catch (error) {
          console.error('Échec de connexion:', error)
        }
  }

 const logout = async () => {
  try {
    const res = await fetch('/api/auth/logout', {
     credentials: 'include',
    })

    if (!res.ok) {
      throw new Error('Failed to log out')
    }

    setUser(null)
    toast.success('Logged out successfully')
  } catch (error) {
    console.error('Logout error:', error)
    toast.error('Logout failed')
  }
}
  const register = async (email: string, password: string, name: string) => {

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (MOCK_USERS.some((u) => u.email === email)) {
        throw new Error('User already exists')
      }

      toast.success('Registration successful! Please log in.')
    } catch (error) {
      toast.error(
        'Registration failed: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      )
      throw error
    }
  }

  const isAdmin = () => user?.role === 'admin'
  const isProjectManager = () =>
    user?.role === 'project_manager' || user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        isAdmin,
        isProjectManager,
      }}
    >
      {isLoading ? 'loading...' : children}
    </AuthContext.Provider>
  )
}

// Hook
  export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
  }