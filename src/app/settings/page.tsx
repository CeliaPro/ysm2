'use client'
import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SessionManagement } from '@/components/SessionManagement'
import  SecuritySettings  from '@/components/SecuritySettings'

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <div className="loader"></div>
      </div>
    )
  }

  if (!user && !isLoading) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 space-y-8">
        <SessionManagement />
        <SecuritySettings /> {/* 👈 ADD THIS LINE */}
      </main>
    </div>
  )
}

