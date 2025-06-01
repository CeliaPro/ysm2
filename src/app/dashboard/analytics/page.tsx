'use client'
import Navbar from '@/components/Navbar'
import { ProjectAnalytics } from '@/components/analytics/ProjectAnalytics'
import { useEffect, useState } from 'react'
import { Project, Task } from '@/types/project'

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch projects
        const projectsRes = await fetch('/api/projects')
        const projectsJson = await projectsRes.json()
        let projectsArr: Project[] = []
        if (Array.isArray(projectsJson.data)) {
          projectsArr = projectsJson.data
        } else if (Array.isArray(projectsJson)) {
          projectsArr = projectsJson
        }
        setProjects(projectsArr)

        // Fetch tasks
        const tasksRes = await fetch('/api/tasks')
        const tasksJson = await tasksRes.json()
        let tasksArr: Task[] = []
        if (Array.isArray(tasksJson.data)) {
          tasksArr = tasksJson.data
        } else if (Array.isArray(tasksJson)) {
          tasksArr = tasksJson
        }
        setTasks(tasksArr)
      } catch (err) {
        setProjects([])
        setTasks([])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <ProjectAnalytics projects={projects} tasks={tasks} />
        )}
      </main>
    </div>
  )
}
