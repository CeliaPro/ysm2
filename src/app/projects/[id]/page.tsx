'use client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import ProjectDetails from '@/components/projects/projectDetails'
import { Project, Task } from '@/types/project'
import { useAuth } from '@/contexts/AuthContext'    // 🟢 Add this

const ProjectDetailsPage = () => {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user, isLoading } = useAuth()             // 🟢 Add this

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)

  // 🟢 Protect the page
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [isLoading, user, router])

  useEffect(() => {
    if (!id) return
    const fetchProjectAndTasks = async () => {
      setLoading(true)
      try {
        const projectRes = await fetch(`/api/projects?id=${id}`)
        const projectJson = await projectRes.json()
        setProject(projectJson && projectJson.data ? projectJson.data : projectJson)

        const tasksRes = await fetch(`/api/tasks?projectId=${id}`)
        const tasksJson = await tasksRes.json()
        setTasks(Array.isArray(tasksJson.data) ? tasksJson.data : [])

        // --- Fetch members ---
        const membersRes = await fetch(`/api/projects/${id}/members`)
        const membersJson = await membersRes.json()
        setMembers(Array.isArray(membersJson.data) ? membersJson.data : [])
      } catch (err) {
        setProject(null)
        setTasks([])
        setMembers([])
      }
      setLoading(false)
    }
    fetchProjectAndTasks()
  }, [id])

  // 🟢 Block rendering if not loaded or not logged in
  if (isLoading || !user) return null
  if (loading) return <div>Loading...</div>
  if (!project) return <div>Projet introuvable</div>

  return (
    <ProjectDetails
      project={project}
      tasks={tasks}
      setTasks={setTasks}
      onBack={() => router.push('/dashboard')}
      members={members}
    />
  )
}

export default ProjectDetailsPage
