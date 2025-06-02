'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import UserManagement from '@/components/UserManagement'
import { useAuth } from '@/contexts/AuthContext'

const UsersPage = () => {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // 🟢 Protect the page!
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [isLoading, user, router])

  if (isLoading || !user) {
    return null // Or show a spinner here
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <UserManagement />
      </main>
    </div>
  )
}

export default UsersPage
