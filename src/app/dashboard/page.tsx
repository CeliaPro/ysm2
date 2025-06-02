'use client'
import Dashboard from '@/components/Dashboard'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Page() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // Optionally: wait until user is loaded (prevents flicker)
  if (!user) {
    return null // or <Spinner /> if you want to show loading
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Dashboard />
      </main>
    </div>
  )
}
