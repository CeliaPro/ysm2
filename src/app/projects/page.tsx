import ProjectsList from '@/components/ProjectsList'
import Navbar from '@/components/Navbar'
import FloatingChat from '@/components/FloatingChat'

export default function Projects() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <ProjectsList />
      </main>
      <FloatingChat />
    </div>
  )
}
