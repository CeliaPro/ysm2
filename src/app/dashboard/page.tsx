'use client'
import Dashboard from '@/components/Dashboard'
import Navbar from '@/components/Navbar'
import FloatingChat from '@/components/FloatingChat'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function Page() {
   const router = useRouter()
  const { user } = useAuth()
  if(!user) {
     router.push('/')
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Dashboard />
      </main>
      <FloatingChat />
    </div>
  )
}
