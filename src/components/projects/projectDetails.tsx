'use client'
import { useState } from "react"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/aiUi/badge"
import TaskTable from "@/components/tasks/taskTable"
import TaskForm from "@/components/tasks/taskForm"
import GanttChart from "@/components/gantt/GanttChart"
import { Project, Task, ProjectStatus } from "@/types/project"
import Navbar from '@/components/Navbar'
import KPITracker from '@/components/analytics/KPITracker'

interface ProjectDetailsProps {
  project: Project
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  onBack: () => void
  members: { id: string; name: string; email: string; }[]
}

const statusLabels: Record<ProjectStatus, string> = {
  'ACTIF': "Actif",
  'EN_ATTENTE': "En attente",
  'TERMINE': "Terminé"
}

const getStatusColor = (status: ProjectStatus | undefined) => {
  switch (status) {
    case 'ACTIF':
      return "bg-green-100 text-green-800"
    case 'TERMINE':
      return "bg-blue-100 text-blue-800"
    case 'EN_ATTENTE':
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// The type for form submission
type TaskFormPayload = Omit<Task, "id" | "createdAt" | "projectId" | "dependencies" | "dependedBy"> & { dependencies?: string[] }

const ProjectDetails = ({
  project,
  tasks,
  setTasks,
  onBack,
  members,
}: ProjectDetailsProps) => {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // --- REFRESH tasks after each mutation
  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?projectId=${project.id}`)
      const json = await res.json()
      setTasks(json.data || [])
    } catch {
      setTasks([])
    }
  }

  // --- CREATE Task (calls API)
  const handleCreateTask = async (taskData: TaskFormPayload) => {
    setFormLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, projectId: project.id })
      })
      if (res.ok) await fetchTasks()
    } catch {}
    setFormLoading(false)
    setShowTaskForm(false)
  }

  // --- UPDATE Task (calls API)
  const handleUpdateTask = async (taskData: TaskFormPayload) => {
    if (!editingTask) return
    setFormLoading(true)
    try {
      const res = await fetch(`/api/tasks?id=${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData })
      })
      if (res.ok) await fetchTasks()
    } catch {}
    setFormLoading(false)
    setEditingTask(null)
    setShowTaskForm(false)
  }

  // --- DELETE Task (calls API)
  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' })
    await fetchTasks()
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  // Stats (for your old cards, now handled by KPITracker!)
  const criticalTasks = tasks.filter(t => t.severity === "CRITIQUE").length
  const inProgressTasks = tasks.filter(t => t.status === "EN_COURS").length
  const completedTasks = tasks.filter(t => t.status === "TERMINEE").length

  if (showTaskForm) {
    return (
      <div>
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux projets
            </Button>
            <div className="w-full text-center">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            </div>
          </div>
          <TaskForm
            task={editingTask}
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={() => {
              setShowTaskForm(false)
              setEditingTask(null)
            }}
            members={members}
            allTasks={tasks} // <-- Pass for dependency selection
            loading={formLoading}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux projets
          </Button>
          <div className="w-full text-center">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
          {project.status && (
            <Badge className={getStatusColor(project.status)}>
              {statusLabels[project.status]}
            </Badge>
          )}
          <Button onClick={() => setShowTaskForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une tâche
          </Button>
        </div>

        {/* Gantt Chart */}
        <GanttChart
          tasks={tasks}
          projectStartDate={project.startDate ? (typeof project.startDate === 'string' ? project.startDate : project.startDate?.toISOString()) : null}
          projectEndDate={project.endDate ? (typeof project.endDate === 'string' ? project.endDate : project.endDate?.toISOString()) : null}
          projectName={project.name}
        />

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tâches du projet</CardTitle>
            <CardDescription>
              Gérez et suivez toutes les tâches de ce projet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskTable
              tasks={tasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          </CardContent>
        </Card>

        {/* --- KPI Performance Tracker --- */}
        <KPITracker tasks={tasks} />

      </div>
    </div>
  )
}

export default ProjectDetails
