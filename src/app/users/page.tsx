'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import UserManagement from '@/components/UserManagement'
import FloatingChat from '@/components/FloatingChat'
import { useAuth } from '@/contexts/AuthContext'

const UsersPage = () => {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <UserManagement />
      </main>
      <FloatingChat />
    </div>
  )
}

export default UsersPage
